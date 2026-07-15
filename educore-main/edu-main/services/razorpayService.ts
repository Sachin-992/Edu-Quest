import { supabase } from './supabaseClient';

export interface RazorpayPaymentOptions {
  invoice_id: string;
  amount: number;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  onSuccess: (receipt: any) => void;
  onError: (error: any) => void;
  simulate?: boolean;
}

class RazorpayService {
  private scriptLoaded = false;

  /**
   * Dynamically loads the Razorpay checkout SDK
   */
  public loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.scriptLoaded || (window as any).Razorpay) {
        this.scriptLoaded = true;
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        this.scriptLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay SDK');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  /**
   * Initiates payment checkout flow
   */
  public async payInvoice(options: RazorpayPaymentOptions): Promise<void> {
    const { invoice_id, amount, studentName, studentEmail, studentPhone, onSuccess, onError, simulate = false } = options;

    if (!supabase) {
      onError({ message: 'Database client not initialized' });
      return;
    }

    try {
      // 1. Create order via Supabase Edge Function
      const { data: orderData, error: orderError } = await supabase.functions.invoke('razorpay', {
        body: {
          action: 'createOrder',
          payload: { invoice_id, simulate }
        }
      });

      if (orderError || !orderData || !orderData.success) {
        console.error('Order creation failed:', orderError || orderData);
        onError(orderError || orderData || { message: 'Failed to create payment order' });
        return;
      }

      // 2. Handle Simulation checkout
      if (orderData.simulate) {
        console.log('Running simulated transaction for order:', orderData.order_id);
        
        // Mock a 1.5 second loading latency
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const mockPaymentId = `pay_sim_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
        const mockSignature = `sig_sim_${Math.random().toString(36).substring(2, 15)}`;

        // Verify simulated transaction
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke('razorpay', {
          body: {
            action: 'verifyPayment',
            payload: {
              invoice_id,
              razorpay_order_id: orderData.order_id,
              razorpay_payment_id: mockPaymentId,
              razorpay_signature: mockSignature,
              simulate: true
            }
          }
        });

        if (verifyError || !verifyData || !verifyData.success) {
          onError(verifyError || verifyData || { message: 'Verification of mock transaction failed' });
        } else {
          onSuccess(verifyData);
        }
        return;
      }

      // 3. Run Real checkout
      const loaded = await this.loadRazorpayScript();
      if (!loaded) {
        onError({ message: 'Razorpay SDK could not be loaded. Check your internet connection.' });
        return;
      }

      const rzpOptions = {
        key: orderData.key_id,
        amount: Math.round(amount * 100),
        currency: orderData.currency || 'INR',
        name: 'EDUCORE-OMEGA',
        description: `Fee Payment for Invoice ${invoice_id.slice(0, 8)}`,
        order_id: orderData.order_id,
        prefill: {
          name: studentName,
          email: studentEmail || 'parent@educore.edu',
          contact: studentPhone || '9999999999'
        },
        theme: {
          color: '#4F46E5' // harmonized brand indigo color
        },
        handler: async (response: any) => {
          try {
            // Verify real transaction
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('razorpay', {
              body: {
                action: 'verifyPayment',
                payload: {
                  invoice_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  simulate: false
                }
              }
            });

            if (verifyError || !verifyData || !verifyData.success) {
              onError(verifyError || verifyData || { message: 'Payment verification failed' });
            } else {
              onSuccess(verifyData);
            }
          } catch (e: any) {
            onError({ message: e.message || 'Payment processing error' });
          }
        },
        modal: {
          ondismiss: () => {
            onError({ message: 'Payment window was closed by the user' });
          }
        }
      };

      const rzp = new (window as any).Razorpay(rzpOptions);
      rzp.open();

    } catch (e: any) {
      console.error('Checkout execution failed:', e);
      onError({ message: e.message || 'An unexpected checkout failure occurred' });
    }
  }
}

export const razorpayService = new RazorpayService();
export default razorpayService;
