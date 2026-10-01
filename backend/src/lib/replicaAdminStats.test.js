const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  SIN_CIUDAD,
  SIN_ESTADO,
  loadReplicaAdminStats,
  summarizePlaces,
  summarizeTransfers,
} = require("./replicaAdminStats");

function queryBuilder(source) {
  const state = {
    head: false,
    filters: [],
    order: null,
    limit: null,
    range: null,
  };
  const builder = {
    select(_columns, opts) {
      state.head = Boolean(opts && opts.head);
      return builder;
    },
    eq(col, val) {
      state.filters.push({ type: "eq", col, val });
      return builder;
    },
    gte(col, val) {
      state.filters.push({ type: "gte", col, val });
      return builder;
    },
    order(col, opts) {
      state.order = { col, ascending: !opts || opts.ascending !== false };
      return builder;
    },
    limit(n) {
      state.limit = n;
      return builder;
    },
    range(from, to) {
      state.range = [from, to];
      return builder;
    },
    then(resolve, reject) {
      try {
        let rows = source.slice();
        for (const filter of state.filters) {
          if (filter.type === "eq") {
            rows = rows.filter((row) => row[filter.col] === filter.val);
          } else if (filter.type === "gte") {
            rows = rows.filter((row) => String(row[filter.col]) >= String(filter.val));
          }
        }
        if (state.order) {
          const { col, ascending } = state.order;
          rows.sort((a, b) => {
            const av = a[col] == null ? "" : String(a[col]);
            const bv = b[col] == null ? "" : String(b[col]);
            if (av < bv) return ascending ? -1 : 1;
            if (av > bv) return ascending ? 1 : -1;
            return 0;
          });
        }
        const count = rows.length;
        if (state.range) rows = rows.slice(state.range[0], state.range[1] + 1);
        if (state.limit != null) rows = rows.slice(0, state.limit);
        resolve({
          data: state.head ? null : rows,
          error: null,
          count,
        });
      } catch (err) {
        reject(err);
      }
    },
  };
  return builder;
}

function createFakeSupabase({ arsenal, transfers, missingTransfers = false }) {
  return {
    from(table) {
      if (table === "arsenal") return queryBuilder(arsenal);
      if (table === "arsenal_transfers") {
        if (missingTransfers) return failing(table);
        return queryBuilder(transfers);
      }
      return failing(table);
    },
  };
}

function failing(table) {
  const builder = {
    select() {
      return builder;
    },
    eq() {
      return builder;
    },
    gte() {
      return builder;
    },
    order() {
      return builder;
    },
    limit() {
      return builder;
    },
    range() {
      return builder;
    },
    then(resolve) {
      resolve({
        data: null,
        error: { message: `relation ${table} does not exist` },
        count: null,
      });
    },
  };
  return builder;
}

describe("summarizePlaces", () => {
  it("agrupa por estado de la república y por ciudad, y manda vacíos a Sin estado/Sin ciudad", () => {
    const summary = summarizePlaces([
      { ciudad: "Guadalajara", estado: "Jalisco" },
      { ciudad: "Guadalajara", estado: "Jalisco" },
      { ciudad: "  Zapopan ", estado: "Jalisco" },
      { ciudad: "", estado: null },
      { ciudad: "Monterrey", estado: "Nuevo León" },
    ]);

    assert.deepEqual(summary.byEstado, [
      { estado: "Jalisco", count: 3 },
      { estado: "Nuevo León", count: 1 },
      { estado: SIN_ESTADO, count: 1 },
    ]);
    assert.equal(summary.byCiudad[0].ciudad, "Guadalajara");
    assert.equal(summary.byCiudad[0].count, 2);
    assert.ok(summary.byCiudad.some((row) => row.ciudad === SIN_CIUDAD));
  });

  it("deja el resto de ciudades fuera del top", () => {
    const rows = [];
    for (let i = 0; i < 10; i += 1) {
      rows.push({ ciudad: `Ciudad ${String(i).padStart(2, "0")}`, estado: "Sonora" });
    }
    rows.push({ ciudad: "Ciudad 00", estado: "Sonora" });
    const summary = summarizePlaces(rows);
    assert.equal(summary.byCiudad.length, 8);
    assert.equal(summary.otrasCiudades, 2);
    assert.equal(summary.byCiudad[0].ciudad, "Ciudad 00");
    assert.equal(summary.byCiudad[0].count, 2);
  });
});

describe("summarizeTransfers", () => {
  it("cuenta pendientes y conserva el resto de status que existan", () => {
    const summary = summarizeTransfers([
      { status: "pendiente" },
      { status: "pendiente" },
      { status: "aceptada" },
      { status: "  " },
    ]);
    assert.equal(summary.pendiente, 2);
    assert.deepEqual(summary.byStatus, [
      { status: "pendiente", count: 2 },
      { status: "aceptada", count: 1 },
      { status: "sin_estado", count: 1 },
    ]);
  });
});

describe("loadReplicaAdminStats", () => {
  const now = new Date("2026-10-01T18:00:00.000Z");

  const arsenal = [
    {
      id: "a",
      nombre: "M4",
      sistema: "Rifle de Asalto",
      ciudad: "CDMX",
      estado: "Ciudad de México",
      verificada: true,
      en_venta: false,
      created_at: "2026-10-01T05:59:59.999Z",
    },
    {
      id: "b",
      nombre: "  Glock  ",
      sistema: "Pistola",
      ciudad: "Guadalajara",
      estado: "Jalisco",
      verificada: false,
      en_venta: true,
      created_at: "2026-10-01T06:00:00.000Z",
    },
    {
      id: "c",
      nombre: "",
      sistema: null,
      ciudad: null,
      estado: "Jalisco",
      verificada: true,
      en_venta: true,
      created_at: "2026-10-01T15:00:00.000Z",
    },
  ];

  it("calcula total, hoy en CDMX, verificadas, en venta, lugares y últimas", async () => {
    const supabase = createFakeSupabase({
      arsenal,
      transfers: [
        { id: "t1", status: "pendiente" },
        { id: "t2", status: "aceptada" },
      ],
    });
    const stats = await loadReplicaAdminStats(supabase, now, { pageSize: 2 });

    assert.equal(stats.timezone, "America/Mexico_City");
    assert.equal(stats.dayStart, "2026-10-01T06:00:00.000Z");
    assert.equal(stats.total, 3);
    assert.equal(stats.registeredToday, 2);
    assert.equal(stats.verificadas, 2);
    assert.equal(stats.enVenta, 2);
    assert.equal(stats.transfers.pendiente, 1);
    assert.equal(stats.transfersUnavailable, false);
    assert.equal(stats.placesUnavailable, false);
    assert.equal(stats.byEstado[0].estado, "Jalisco");
    assert.equal(stats.byEstado[0].count, 2);
    assert.deepEqual(
      stats.recent.map((row) => row.id),
      ["c", "b", "a"]
    );
    assert.equal(stats.recent[0].nombre, "Sin nombre");
    assert.equal(stats.recent[1].nombre, "Glock");
    assert.equal(stats.recent[2].nombre, "M4");
    assert.equal(stats.recent[0].verificada, true);
    assert.equal(stats.recent[1].en_venta, true);
  });

  it("sigue devolviendo réplicas si arsenal_transfers no se puede leer", async () => {
    const supabase = createFakeSupabase({
      arsenal,
      transfers: [],
      missingTransfers: true,
    });
    const stats = await loadReplicaAdminStats(supabase, now, { pageSize: 2 });
    assert.equal(stats.total, 3);
    assert.equal(stats.transfers, null);
    assert.equal(stats.transfersUnavailable, true);
  });
});
