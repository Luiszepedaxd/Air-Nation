#!/usr/bin/env bash
# Smoke test de los endpoints de ARENA. No crea nada que no se pueda borrar
# desde el panel. Todo sale de variables de entorno: aquí no hay datos reales.
#
#   export ARENA_API=http://localhost:4000/api/v1
#   export ARENA_ADMIN_TOKEN=<JWT de un usuario con app_role=admin>
#   export ARENA_OWNER_TOKEN=<JWT de un miembro del campo>   # opcional
#   export ARENA_FIELD_ID=<uuid de un campo ya cargado>
#   export ARENA_USER_ID=<uuid de la cuenta a ligar>         # opcional
#   export ARENA_MOCK_WEBHOOK_SECRET=<mismo valor que el backend>  # opcional
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

paso "PATCH /arena/owner/fields/\$FIELD/settings (incluye disciplinas, terrenos y edad mínima)"
llamar PATCH "$OWNER" "/arena/owner/fields/$FIELD/settings" \
  '{"cancelacion_horas_limite":24,"anticipacion_min_horas":12,"politica_cancelacion":"Cancela hasta 24 h antes de la apertura y te devolvemos el 100%.","disciplinas":["airsoft","gotcha"],"terrenos":["bosque"],"edad_minima":12}'

paso "PATCH settings con disciplina inventada (espera 400)"
llamar PATCH "$OWNER" "/arena/owner/fields/$FIELD/settings" '{"disciplinas":["paintball"]}'

paso "PATCH /arena/owner/fields/\$FIELD/settings con CLABE inválida (espera 400)"
llamar PATCH "$OWNER" "/arena/owner/fields/$FIELD/settings" '{"clabe":"123"}'

paso "POST /arena/owner/fields/\$FIELD/items (paquete por persona, con disciplina y duración)"
llamar POST "$OWNER" "/arena/owner/fields/$FIELD/items" \
  '{"tipo":"paquete","nombre":"Paquete smoke test","precio_centavos":35000,"unidad":"por_persona","incluye":["Entrada","500 BBs"],"orden":1,"disciplina":"airsoft","duracion_min":180}'
ITEM_ID="$(sed -n 's/.*"id":"\([0-9a-f-]\{36\}\)".*/\1/p' /tmp/arena-smoke.out | head -1)"
echo "item creado: ${ITEM_ID:-ninguno}"

paso "POST item con duración fuera de rango (espera 400)"
llamar POST "$OWNER" "/arena/owner/fields/$FIELD/items" \
  '{"tipo":"paquete","nombre":"X","precio_centavos":100,"duracion_min":5}'

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

# ─── Reservas, pago mock, QR y check-in ──────────────────────────────────────
# Necesita que el campo tenga ARENA activo, un item base y el día abierto.
# ARENA_ITEM_ID y ARENA_FECHA se pueden fijar a mano.

# ─── Marketplace y carrito ───────────────────────────────────────────────────
paso "GET /arena/marketplace (sin filtros)"
curl -sS -o /tmp/arena-smoke.out -w 'HTTP %{http_code}\n' "$API/arena/marketplace"
head -c 700 /tmp/arena-smoke.out; echo

paso "GET /arena/marketplace con filtros válidos"
curl -sS -o /tmp/arena-smoke.out -w 'HTTP %{http_code}\n' \
  "$API/arena/marketplace?disciplina=airsoft&terreno=bosque&jugadores=6&precio_max=50000&con_renta=true&rating_min=4&orden=precio_asc"
head -c 400 /tmp/arena-smoke.out; echo

paso "GET /arena/marketplace con disciplina inventada (espera 400)"
curl -sS -o /tmp/arena-smoke.out -w 'HTTP %{http_code}\n' "$API/arena/marketplace?disciplina=paintball"
head -c 200 /tmp/arena-smoke.out; echo

paso "GET /arena/marketplace con fecha mal formada (espera 400)"
curl -sS -o /dev/null -w 'HTTP %{http_code}\n' "$API/arena/marketplace?fecha=24-10-2026"

paso "GET /arena/fields/\$SLUG (ficha pública)"
if [ -n "${ARENA_FIELD_SLUG:-}" ]; then
  curl -sS -o /tmp/arena-smoke.out -w 'HTTP %{http_code}\n' "$API/arena/fields/$ARENA_FIELD_SLUG"
  head -c 600 /tmp/arena-smoke.out; echo
else
  echo "(sin ARENA_FIELD_SLUG, omitido)"
fi

HASTA="$(date -u -d '+30 days' +%Y-%m-%d 2>/dev/null || date -u -v+30d +%Y-%m-%d)"
paso "GET /arena/fields/\$FIELD/open-days"
curl -sS -o /tmp/arena-open-days.out -w 'HTTP %{http_code}\n' \
  "$API/arena/fields/$FIELD/open-days?desde=$(date -u +%Y-%m-%d)&hasta=$HASTA"
cp /tmp/arena-open-days.out /tmp/arena-smoke.out
head -c 600 /tmp/arena-smoke.out; echo
FECHA="${ARENA_FECHA:-$(sed -n 's/.*"fecha":"\([0-9-]\{10\}\)".*/\1/p' /tmp/arena-smoke.out | head -1)}"
echo "primer día abierto: ${FECHA:-ninguno}"

paso "GET /arena/owner/fields/\$FIELD/items (para tomar el item base)"
llamar GET "$OWNER" "/arena/owner/fields/$FIELD/items" > /dev/null
BASE_ID="${ARENA_ITEM_ID:-$(sed -n 's/.*"id":"\([0-9a-f-]\{36\}\)"[^}]*"es_base":true.*/\1/p' /tmp/arena-smoke.out | head -1)}"
echo "item base: ${BASE_ID:-ninguno}"

if [ -n "${FECHA:-}" ] && [ -n "${BASE_ID:-}" ]; then
  paso "POST /arena/bookings (invitado)"
  curl -sS -o /tmp/arena-smoke.out -w 'HTTP %{http_code}\n' \
    -X POST "$API/arena/bookings" -H 'Content-Type: application/json' \
    -d "{\"field_id\":\"$FIELD\",\"fecha\":\"$FECHA\",\"num_jugadores\":4,\"items\":[{\"item_id\":\"$BASE_ID\"}],\"contacto_nombre\":\"Smoke Test\",\"contacto_email\":\"${ARENA_TEST_EMAIL:-smoke@example.com}\",\"acepta_politica\":true}"
  head -c 600 /tmp/arena-smoke.out; echo
  CODIGO="$(sed -n 's/.*"codigo":"\(AR-[0-9A-Z]\{6\}\)".*/\1/p' /tmp/arena-smoke.out | head -1)"
  TOKEN="$(sed -n 's/.*"access_token":"\([0-9a-f]\{64\}\)".*/\1/p' /tmp/arena-smoke.out | head -1)"
  PAGO_ID="$(sed -n 's/.*"pago":{"id":"\([0-9a-f-]\{36\}\)".*/\1/p' /tmp/arena-smoke.out | head -1)"
  echo "reserva $CODIGO · pago $PAGO_ID"

  paso "POST /arena/bookings con precio alterado (el cliente no manda montos; espera 201 con el total de la BD)"
  curl -sS -o /tmp/arena-smoke.out -w 'HTTP %{http_code}\n' \
    -X POST "$API/arena/bookings" -H 'Content-Type: application/json' \
    -d "{\"field_id\":\"$FIELD\",\"fecha\":\"$FECHA\",\"num_jugadores\":4,\"total_centavos\":1,\"items\":[{\"item_id\":\"$BASE_ID\",\"precio_centavos\":1}],\"contacto_nombre\":\"Smoke\",\"contacto_email\":\"${ARENA_TEST_EMAIL:-smoke@example.com}\",\"acepta_politica\":true}"
  head -c 300 /tmp/arena-smoke.out; echo

  paso "POST /arena/bookings sin aceptar la política (espera 400)"
  curl -sS -o /dev/null -w 'HTTP %{http_code}\n' \
    -X POST "$API/arena/bookings" -H 'Content-Type: application/json' \
    -d "{\"field_id\":\"$FIELD\",\"fecha\":\"$FECHA\",\"num_jugadores\":4,\"items\":[{\"item_id\":\"$BASE_ID\"}],\"contacto_nombre\":\"X\",\"contacto_email\":\"x@example.com\"}"

  if [ -n "${CODIGO:-}" ] && [ -n "${TOKEN:-}" ]; then
    paso "GET /arena/bookings/\$CODIGO con token"
    curl -sS -o /tmp/arena-smoke.out -w 'HTTP %{http_code}\n' "$API/arena/bookings/$CODIGO?t=$TOKEN"
    head -c 500 /tmp/arena-smoke.out; echo

    paso "GET /arena/bookings/\$CODIGO con token ajeno (espera 404)"
    curl -sS -o /dev/null -w 'HTTP %{http_code}\n' "$API/arena/bookings/$CODIGO?t=$(printf '0%.0s' $(seq 64))"

    paso "GET qr.png antes de pagar (espera 404)"
    curl -sS -o /dev/null -w 'HTTP %{http_code}\n' "$API/arena/bookings/$CODIGO/qr.png?t=$TOKEN"
  fi

  if [ -n "${PAGO_ID:-}" ]; then
    paso "POST /arena/payments/mock/\$PAGO_ID/complete?result=ok"
    curl -sS -o /tmp/arena-smoke.out -w 'HTTP %{http_code}\n' \
      -X POST "$API/arena/payments/mock/$PAGO_ID/complete?result=ok"
    head -c 300 /tmp/arena-smoke.out; echo

    paso "Repetir el mismo pago (idempotencia: espera ya_procesado)"
    curl -sS -o /tmp/arena-smoke.out -w 'HTTP %{http_code}\n' \
      -X POST "$API/arena/payments/mock/$PAGO_ID/complete?result=ok"
    head -c 300 /tmp/arena-smoke.out; echo

    paso "GET qr.png ya pagada (espera 200 image/png)"
    curl -sS -o /tmp/arena-qr.png -w 'HTTP %{http_code} · %{content_type} · %{size_download} bytes\n' \
      "$API/arena/bookings/$CODIGO/qr.png?t=$TOKEN"
  fi

  # ── Carrito: 2 reservas del mismo campo en días distintos, un solo pago ──
  # Segundo día abierto (el JSON viene en una sola línea: grep -o, no sed).
  FECHA2="$(grep -o '"fecha":"[0-9-]\{10\}"' /tmp/arena-open-days.out 2>/dev/null | grep -o '[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}' | grep -v "^$FECHA$" | head -1)"
  paso "POST /arena/checkout (carrito con ${FECHA2:+2 reservas}${FECHA2:-1 reserva})"
  if [ -n "${FECHA2:-}" ]; then
    RESERVAS="[{\"field_id\":\"$FIELD\",\"fecha\":\"$FECHA\",\"num_jugadores\":4,\"items\":[{\"item_id\":\"$BASE_ID\"}]},{\"field_id\":\"$FIELD\",\"fecha\":\"$FECHA2\",\"num_jugadores\":6,\"items\":[{\"item_id\":\"$BASE_ID\"}]}]"
  else
    RESERVAS="[{\"field_id\":\"$FIELD\",\"fecha\":\"$FECHA\",\"num_jugadores\":4,\"items\":[{\"item_id\":\"$BASE_ID\"}]}]"
  fi
  curl -sS -o /tmp/arena-smoke.out -w 'HTTP %{http_code}\n' \
    -X POST "$API/arena/checkout" -H 'Content-Type: application/json' \
    -d "{\"reservas\":$RESERVAS,\"contacto\":{\"nombre\":\"Carrito Test\",\"email\":\"${ARENA_TEST_EMAIL:-smoke@example.com}\"},\"acepta_politica\":true}"
  head -c 700 /tmp/arena-smoke.out; echo
  PAY_ID="$(sed -n 's/.*"payment_id":"\([0-9a-f-]\{36\}\)".*/\1/p' /tmp/arena-smoke.out | head -1)"
  PAY_TOKEN="$(sed -n 's/.*"access_token":"\([0-9a-f]\{64\}\)".*/\1/p' /tmp/arena-smoke.out | head -1)"
  echo "pago del carrito: ${PAY_ID:-ninguno}"

  paso "POST /arena/checkout con el mismo campo y día dos veces (espera 409 carrito_duplicado)"
  curl -sS -o /tmp/arena-smoke.out -w 'HTTP %{http_code}\n' \
    -X POST "$API/arena/checkout" -H 'Content-Type: application/json' \
    -d "{\"reservas\":[{\"field_id\":\"$FIELD\",\"fecha\":\"$FECHA\",\"num_jugadores\":4,\"items\":[{\"item_id\":\"$BASE_ID\"}]},{\"field_id\":\"$FIELD\",\"fecha\":\"$FECHA\",\"num_jugadores\":4,\"items\":[{\"item_id\":\"$BASE_ID\"}]}],\"contacto\":{\"nombre\":\"X\",\"email\":\"x@example.com\"},\"acepta_politica\":true}"
  head -c 300 /tmp/arena-smoke.out; echo

  paso "POST /arena/checkout sin aceptar la política (espera 400)"
  curl -sS -o /dev/null -w 'HTTP %{http_code}\n' \
    -X POST "$API/arena/checkout" -H 'Content-Type: application/json' \
    -d "{\"reservas\":$RESERVAS,\"contacto\":{\"nombre\":\"X\",\"email\":\"x@example.com\"}}"

  if [ -n "${PAY_ID:-}" ] && [ -n "${PAY_TOKEN:-}" ]; then
    paso "GET /arena/checkout/\$PAY_ID con token (pendiente de pago)"
    curl -sS -o /tmp/arena-smoke.out -w 'HTTP %{http_code}\n' "$API/arena/checkout/$PAY_ID?t=$PAY_TOKEN"
    head -c 700 /tmp/arena-smoke.out; echo

    paso "GET /arena/checkout/\$PAY_ID con token ajeno (espera 404)"
    curl -sS -o /dev/null -w 'HTTP %{http_code}\n' "$API/arena/checkout/$PAY_ID?t=$(printf '0%.0s' $(seq 64))"

    paso "POST /arena/payments/mock/\$PAY_ID/complete?result=ok (confirma TODAS las reservas del pago)"
    curl -sS -o /tmp/arena-smoke.out -w 'HTTP %{http_code}\n' \
      -X POST "$API/arena/payments/mock/$PAY_ID/complete?result=ok"
    head -c 400 /tmp/arena-smoke.out; echo

    paso "Repetir el pago del carrito (idempotencia: espera ya_procesado, sin email doble)"
    curl -sS -o /tmp/arena-smoke.out -w 'HTTP %{http_code}\n' \
      -X POST "$API/arena/payments/mock/$PAY_ID/complete?result=ok"
    head -c 300 /tmp/arena-smoke.out; echo

    paso "GET /arena/checkout/\$PAY_ID ya pagado (un QR por reserva)"
    curl -sS -o /tmp/arena-smoke.out -w 'HTTP %{http_code}\n' "$API/arena/checkout/$PAY_ID?t=$PAY_TOKEN"
    head -c 900 /tmp/arena-smoke.out; echo

    CODIGO_CARRITO="$(sed -n 's/.*"codigo":"\(AR-[0-9A-Z]\{6\}\)".*/\1/p' /tmp/arena-smoke.out | head -1)"
    TOKEN_CARRITO="$(sed -n 's/.*"access_token":"\([0-9a-f]\{64\}\)".*/\1/p' /tmp/arena-smoke.out | head -1)"
    if [ -n "${CODIGO_CARRITO:-}" ] && [ -n "${TOKEN_CARRITO:-}" ]; then
      paso "POST /arena/bookings/\$CODIGO_CARRITO/cancel (reembolso PARCIAL: solo esa reserva)"
      curl -sS -o /tmp/arena-smoke.out -w 'HTTP %{http_code}\n' \
        -X POST "$API/arena/bookings/$CODIGO_CARRITO/cancel" -H 'Content-Type: application/json' \
        -d "{\"t\":\"$TOKEN_CARRITO\",\"motivo\":\"smoke test\"}"
      head -c 500 /tmp/arena-smoke.out; echo

      paso "GET /arena/checkout/\$PAY_ID (las demás reservas siguen confirmadas)"
      curl -sS -o /tmp/arena-smoke.out -w 'HTTP %{http_code}\n' "$API/arena/checkout/$PAY_ID?t=$PAY_TOKEN"
      head -c 900 /tmp/arena-smoke.out; echo
    fi
  fi

  paso "GET /arena/owner/fields/\$FIELD/bookings (agenda del día reservado)"
  llamar GET "$OWNER" "/arena/owner/fields/$FIELD/bookings?desde=$FECHA&hasta=$FECHA"

  paso "POST /arena/owner/fields/\$FIELD/bookings (reserva manual, link de 2 h)"
  llamar POST "$OWNER" "/arena/owner/fields/$FIELD/bookings" \
    "{\"fecha\":\"$FECHA\",\"num_jugadores\":2,\"items\":[{\"item_id\":\"$BASE_ID\"}],\"contacto_nombre\":\"WhatsApp Test\",\"contacto_email\":\"${ARENA_TEST_EMAIL:-smoke@example.com}\"}"

  if [ -n "${CODIGO:-}" ] && [ -n "${TOKEN:-}" ]; then
    paso "POST /arena/bookings/\$CODIGO/cancel (reembolso si está en plazo)"
    curl -sS -o /tmp/arena-smoke.out -w 'HTTP %{http_code}\n' \
      -X POST "$API/arena/bookings/$CODIGO/cancel" -H 'Content-Type: application/json' \
      -d "{\"t\":\"$TOKEN\",\"motivo\":\"smoke test\"}"
    head -c 400 /tmp/arena-smoke.out; echo

    paso "Cancelar dos veces (espera 409 transicion_invalida)"
    curl -sS -o /dev/null -w 'HTTP %{http_code}\n' \
      -X POST "$API/arena/bookings/$CODIGO/cancel" -H 'Content-Type: application/json' \
      -d "{\"t\":\"$TOKEN\"}"
  fi
else
  echo "(sin día abierto o sin item base: se omiten las pruebas de reserva)"
fi

paso "GET /arena/me/bookings"
llamar GET "$OWNER" "/arena/me/bookings"

paso "GET /arena/checkin con QR inventado (espera 404)"
llamar GET "$OWNER" "/arena/checkin/$(printf 'a%.0s' $(seq 64))"

# Sin ARENA_MOCK_WEBHOOK_SECRET en el backend no hay con qué verificar la firma
# y el webhook responde 503 en vez de 400.
if [ -n "${ARENA_MOCK_WEBHOOK_SECRET:-}" ]; then
  paso "POST webhook mock sin firma (espera 400)"
else
  paso "POST webhook mock sin ARENA_MOCK_WEBHOOK_SECRET (espera 503)"
fi
curl -sS -o /dev/null -w 'HTTP %{http_code}\n' \
  -X POST "$API/arena/payments/webhook/mock" -H 'Content-Type: application/json' \
  -d '{"provider_ref":"mock_x","status":"pagado"}'

if [ -n "${ARENA_MOCK_WEBHOOK_SECRET:-}" ]; then
  paso "POST webhook mock firmado con provider_ref inventado (espera 200 ignorado)"
  CUERPO='{"provider_ref":"mock_inventado","status":"pagado"}'
  FIRMA="$(printf '%s' "$CUERPO" \
    | openssl dgst -sha256 -hmac "$ARENA_MOCK_WEBHOOK_SECRET" -r | cut -d' ' -f1)"
  curl -sS -o /dev/null -w 'HTTP %{http_code}\n' \
    -X POST "$API/arena/payments/webhook/mock" -H 'Content-Type: application/json' \
    -H "x-arena-mock-signature: $FIRMA" -d "$CUERPO"
fi

# ─── Reservas de admin y liquidaciones ───────────────────────────────────────

paso "GET /arena/admin/bookings?field_id=\$FIELD"
llamar GET "$ADMIN" "/arena/admin/bookings?field_id=$FIELD"

paso "GET /arena/admin/payouts/pendientes"
llamar GET "$ADMIN" "/arena/admin/payouts/pendientes"

paso "POST /arena/admin/fields/\$FIELD/payouts (409 sin_reservas_por_liquidar si no hay nada vencido)"
llamar POST "$ADMIN" "/arena/admin/fields/$FIELD/payouts" '{}'
PAYOUT_ID="$(sed -n 's/.*"payout":{"id":"\([0-9a-f-]\{36\}\)".*/\1/p' /tmp/arena-smoke.out | head -1)"

if [ -n "${PAYOUT_ID:-}" ]; then
  paso "PATCH /arena/admin/payouts/\$PAYOUT_ID (folio + email al dueño)"
  llamar PATCH "$ADMIN" "/arena/admin/payouts/$PAYOUT_ID" '{"referencia":"SPEI-SMOKE-0001"}'

  paso "Repetir la transferencia (espera 409)"
  llamar PATCH "$ADMIN" "/arena/admin/payouts/$PAYOUT_ID" '{"referencia":"SPEI-SMOKE-0001"}'
fi

paso "PATCH payout sin folio (espera 400)"
llamar PATCH "$ADMIN" "/arena/admin/payouts/00000000-0000-0000-0000-000000000000" '{}'

paso "GET /arena/owner/fields/\$FIELD/saldos"
llamar GET "$OWNER" "/arena/owner/fields/$FIELD/saldos"

paso "PATCH /arena/admin/fields/\$FIELD/pause"
llamar PATCH "$ADMIN" "/arena/admin/fields/$FIELD/pause"

printf '\nListo. Revisa que ningún paso haya dado 500.\n'
