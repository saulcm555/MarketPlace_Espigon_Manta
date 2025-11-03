package models

// PaymentMethod representa un método de pago simplificado para eventos en tiempo real.
// Sincronizado con PaymentMethodEntity del rest_service.
type PaymentMethod struct {
	IDPaymentMethod int    `json:"id_payment_method"`
	MethodName      string `json:"method_name"` // "credit_card", "debit_card", "cash", "transfer"
	DetailsPayment  string `json:"details_payment,omitempty"`
}
