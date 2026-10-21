#!/usr/bin/env bash
# Smoke test de los endpoints de ARENA. No crea nada que no se pueda borrar
# desde el panel. Todo sale de variables de entorno: aquí no hay datos reales.
#
#   export ARENA_API=http://localhost:4000/api/v1
#   export ARENA_ADMIN_TOKEN=<JWT de un usuario con app_role=admin>
#   export ARENA_OWNER_TOKEN=<JWT de un miembro del campo>   # opcional
#   export ARENA_FIELD_ID=<uuid de un campo ya cargado>
#   export ARENA_USER_ID=<uuid de la cuenta a ligar>         # opcional
#   bash backend/scripts/arena-smoke.sh
set -u

API="${ARENA_API:-http://localhost:4000/api/v1}"
ADMIN="${ARENA_ADMIN_TOKEN:-}"
OWNER="${ARENA_OWNER_TOKEN:-$ADMIN}"
FIELD="${ARENA_FIELD_ID:-}"
USER="${ARENA_USER_ID:-}"

if [ -z "$ADMIN" ] || [ -z "$FIELD" ]; then
  echo "Faltan ARENA_ADMIN_TOKEN y/o ARENA_FIELD_ID." >&2
  exit 1
fi

paso() { printf '\n──── %s\n' "$1"; }

llamar() { # llamar <método> <token> <ruta> [json]
  local metodo="$1" token="$2" ruta="$3" cuerpo="${4:-}"
  if [ -n "$cuerpo" ]; then
    curl -sS -o /tmp/arena-smoke.out -w 'HTTP %{http_code}\n' \
      -X "$metodo" "$API$ruta" \
      -H "Authorization: Bearer $token" -H 'Content-Type: application/json' \
      -d "$cuerpo"
  else
    curl -sS -o /tmp/arena-smoke.out -w 'HTTP %{http_code}\n' \
      -X "$metodo" "$API$ruta" -H "Authorization: Bearer $token"
  fi
  head -c 600 /tmp/arena-smoke.out; echo
}

paso "GET /arena/admin/fields"
llamar GET "$ADMIN" "/arena/admin/fields"

paso "PUT /arena/admin/fields/\$FIELD/activate (plan free, 8%, activo)"
llamar PUT "$ADMIN" "/arena/admin/fields/$FIELD/activate" \
  '{"plan":"free","comision_pct":8,"activo":true}'

paso "GET /arena/admin/fields/\$FIELD/members"
llamar GET "$ADMIN" "/arena/admin/fields/$FIELD/members"

if [ -n "$USER" ]; then
  paso "POST /arena/admin/fields/\$FIELD/members (liga cuenta + email)"
  llamar POST "$ADMIN" "/arena/admin/fields/$FIELD/members" "{\"user_id\":\"$USER\"}"
fi

paso "GET /arena/owner/fields"
llamar GET "$OWNER" "/arena/owner/fields"

paso "GET /arena/owner/fields/\$FIELD/settings"
llamar GET "$OWNER" "/arena/owner/fields/$FIELD/settings"

paso "PATCH /arena/owner/fields/\$FIELD/settings"
llamar PATCH "$OWNER" "/arena/owner/fields/$FIELD/settings" \
  '{"cancelacion_horas_limite":24,"anticipacion_min_horas":12,"politica_cancelacion":"Cancela hasta 24 h antes de la apertura y te devolvemos el 100%."}'

paso "PATCH /arena/owner/fields/\$FIELD/settings con CLABE inválida (espera 400)"
llamar PATCH "$OWNER" "/arena/owner/fields/$FIELD/settings" '{"clabe":"123"}'

paso "POST /arena/owner/fields/\$FIELD/items (paquete por persona)"
llamar POST "$OWNER" "/arena/owner/fields/$FIELD/items" \
  '{"tipo":"paquete","nombre":"Paquete smoke test","precio_centavos":35000,"unidad":"por_persona","incluye":["Entrada","500 BBs"],"orden":1}'
ITEM_ID="$(sed -n 's/.*"id":"\([0-9a-f-]\{36\}\)".*/\1/p' /tmp/arena-smoke.out | head -1)"
echo "item creado: ${ITEM_ID:-ninguno}"

paso "POST item con tipo inválido (espera 400)"
llamar POST "$OWNER" "/arena/owner/fields/$FIELD/items" \
  '{"tipo":"combo","nombre":"X","precio_centavos":100}'

paso "GET /arena/owner/fields/\$FIELD/items"
llamar GET "$OWNER" "/arena/owner/fields/$FIELD/items"

if [ -n "${ITEM_ID:-}" ]; then
  paso "PATCH /arena/owner/fields/\$FIELD/items/\$ITEM_ID"
  llamar PATCH "$OWNER" "/arena/owner/fields/$FIELD/items/$ITEM_ID" '{"precio_centavos":40000}'

  paso "DELETE /arena/owner/fields/\$FIELD/items/\$ITEM_ID"
  llamar DELETE "$OWNER" "/arena/owner/fields/$FIELD/items/$ITEM_ID"
fi

paso "PATCH /arena/owner/fields/\$FIELD/horario (sábado y domingo)"
llamar PATCH "$OWNER" "/arena/owner/fields/$FIELD/horario" \
  '{"horarios_json":{"sabado":{"abierto":true,"apertura":"09:00","cierre":"18:00"},"domingo":{"abierto":true,"apertura":"09:00","cierre":"16:00"}}}'

paso "PATCH horario con cierre antes de la apertura (espera 400)"
llamar PATCH "$OWNER" "/arena/owner/fields/$FIELD/horario" \
  '{"horarios_json":{"sabado":{"abierto":true,"apertura":"18:00","cierre":"09:00"}}}'

FECHA_CERRADA="$(date -u -d '+200 days' +%Y-%m-%d 2>/dev/null || date -u -v+200d +%Y-%m-%d)"
paso "POST /arena/owner/fields/\$FIELD/blackouts ($FECHA_CERRADA)"
llamar POST "$OWNER" "/arena/owner/fields/$FIELD/blackouts" \
  "{\"fecha\":\"$FECHA_CERRADA\",\"motivo\":\"smoke test\"}"
BLACKOUT_ID="$(sed -n 's/.*"id":"\([0-9a-f-]\{36\}\)".*/\1/p' /tmp/arena-smoke.out | head -1)"

paso "GET /arena/owner/fields/\$FIELD/blackouts"
llamar GET "$OWNER" "/arena/owner/fields/$FIELD/blackouts"

if [ -n "${BLACKOUT_ID:-}" ]; then
  paso "DELETE /arena/owner/fields/\$FIELD/blackouts/\$BLACKOUT_ID"
  llamar DELETE "$OWNER" "/arena/owner/fields/$FIELD/blackouts/$BLACKOUT_ID"
fi

paso "GET settings sin token (espera 401)"
curl -sS -o /dev/null -w 'HTTP %{http_code}\n' "$API/arena/owner/fields/$FIELD/settings"

paso "PATCH /arena/admin/fields/\$FIELD/pause"
llamar PATCH "$ADMIN" "/arena/admin/fields/$FIELD/pause"

printf '\nListo. Revisa que ningún paso haya dado 500.\n'
