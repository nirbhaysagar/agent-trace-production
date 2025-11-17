# Payment Methods Available in AgentTrace

## Currently Supported Payment Methods

### ✅ Credit and Debit Cards
- **Available:** Globally, for all users
- **Supported Cards:** Visa, Mastercard, American Express, Discover, and other major card networks
- **Works for:** All countries including India

### ✅ Stripe Link
- **Available:** US, UK, and other supported countries
- **What it is:** Stripe's one-click checkout solution
- **Benefits:** Faster checkout for returning customers
- **Note:** Automatically shown if available in customer's region

## Payment Methods NOT Currently Available

### ❌ UPI (Unified Payments Interface) - India
- **Status:** NOT supported by Stripe
- **Reason:** Stripe has limited operations in India due to regulatory challenges
- **Alternative for Indian Users:** Credit/debit cards work perfectly
- **Future:** Stripe may add UPI support when they expand operations in India

## How Payment Methods Work

1. **Automatic Detection:** Stripe automatically detects the customer's location and shows available payment methods
2. **Card Support:** Credit and debit cards work globally, including India
3. **Regional Methods:** Additional payment methods (like Link) appear automatically if available in the customer's region

## For Indian Customers

Indian users can pay using:
- ✅ **Credit Cards** (Visa, Mastercard, Amex, etc.)
- ✅ **Debit Cards** (Visa, Mastercard, RuPay - if supported by Stripe)
- ❌ **UPI** - Not available (Stripe limitation)

## Technical Details

The checkout session is configured with:
- `payment_method_types: ["card", "link"]`
- Stripe automatically filters available methods based on:
  - Customer location
  - Account capabilities
  - Regional regulations

## Future Payment Methods

If you want to add more payment methods in the future, you can:
1. Check Stripe's documentation for available methods in your target regions
2. Update `payment_method_types` in `backend/stripe_service.py`
3. Ensure your Stripe account is enabled for those payment methods

## Alternative Solutions for UPI Support

If UPI support is critical for your Indian customers, consider:
1. **Razorpay** - Indian payment gateway with full UPI support
2. **PayU** - Another Indian payment gateway
3. **Cashfree** - Indian payment gateway with UPI
4. **Stripe + Alternative Gateway** - Use Stripe for international, alternative for India

Note: Integrating an alternative gateway would require additional development work.

