# Webhook de pagos (preparado, no activado)

Este directorio reserva el punto de integración para Mercado Pago o Stripe.

Cuando se elija proveedor:

1. Crear una Edge Function de Supabase.
2. Validar obligatoriamente la firma del webhook.
3. Consultar el pago directamente al proveedor.
4. Comparar monto, moneda, usuario y `prompt_id`.
5. Insertar o actualizar `public.purchases` con `status = 'paid'`.

La `service_role` sólo puede existir como secreto de la función. Nunca debe usarse
en React, GitHub Pages ni en una variable `VITE_*`.

No se incluye un webhook falso porque permitiría registrar compras sin validación.
