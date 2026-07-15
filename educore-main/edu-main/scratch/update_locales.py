import json

en_adds = {
    "financeFees": {
        "onlinePayments": "Online Payments",
        "cashPayments": "Cash Payments",
        "onlineOfflineRatio": "Online vs Offline Collections",
        "monthlyTrends": "Monthly Collection Trends",
        "methodSplit": "Payment Method Split",
        "transactionId": "Transaction ID",
        "paymentMethod": "Payment Method",
        "datePaid": "Date Paid",
        "receiptNo": "Receipt No",
        "viewReceipt": "View Receipt",
        "downloadReceipt": "Download Receipt",
        "onlineCollectionRate": "Online Collection Rate",
        "offlineCollectionRate": "Offline Collection Rate",
        "totalFeeVolume": "Total Fee Volume"
    },
    "parentPortal": {
        "feesTab": "Fees & Payments",
        "feeStructure": "Fee Structure",
        "paymentHistory": "Payment History",
        "outstandingDues": "Outstanding Dues",
        "payOnline": "Pay Online",
        "paySimulated": "Pay (Simulator)",
        "paymentSuccess": "Payment Successful!",
        "paymentSuccessMsg": "Your payment has been successfully processed. Receipt code: {{receipt}}",
        "paymentFailed": "Payment Failed",
        "paymentFailedMsg": "The payment transaction could not be completed. Please try again.",
        "downloadReceipt": "Download Receipt",
        "printReceipt": "Print Receipt",
        "noDues": "No outstanding dues. Thank you!",
        "dueDate": "Due Date",
        "feeType": "Fee Type",
        "invoiceNo": "Invoice No",
        "status": "Status",
        "amount": "Amount",
        "due": "Due",
        "paid": "Paid",
        "checkoutTitle": "EDUCORE Fee Payment",
        "checkoutDesc": "Secure Online Payment via Razorpay"
    }
}

ta_adds = {
    "financeFees": {
        "onlinePayments": "ஆன்லைன் கட்டணங்கள்",
        "cashPayments": "ரொக்கக் கட்டணங்கள்",
        "onlineOfflineRatio": "ஆன்லைன் மற்றும் ஆஃப்லைன் வசூல்",
        "monthlyTrends": "மாதாந்திர வசூல் போக்குகள்",
        "methodSplit": "கட்டண முறைப் பிரிவு",
        "transactionId": "பரிவர்த்தனை ஐடி",
        "paymentMethod": "கட்டண முறை",
        "datePaid": "செலுத்தப்பட்ட தேதி",
        "receiptNo": "ரசீது எண்",
        "viewReceipt": "ரசீதை காண்க",
        "downloadReceipt": "ரசீதை பதிவிறக்கு",
        "onlineCollectionRate": "ஆன்லைன் வசூல் வீதம்",
        "offlineCollectionRate": "ஆஃப்லைன் வசூல் வீதம்",
        "totalFeeVolume": "மொத்த கட்டண அளவு"
    },
    "parentPortal": {
        "feesTab": "கட்டணங்கள் & செலுத்துதல்கள்",
        "feeStructure": "கட்டண அமைப்பு",
        "paymentHistory": "செலுத்தப்பட்ட வரலாறு",
        "outstandingDues": "செலுத்த வேண்டிய நிலுவைகள்",
        "payOnline": "ஆன்லைனில் செலுத்து",
        "paySimulated": "செலுத்து (சிமுலேட்டர்)",
        "paymentSuccess": "கட்டணம் வெற்றிகரமாக செலுத்தப்பட்டது!",
        "paymentSuccessMsg": "உங்கள் கட்டணப் பரிவர்த்தனை வெற்றிகரமாக முடிந்தது. ரசீது குறியீடு: {{receipt}}",
        "paymentFailed": "கட்டணம் செலுத்த முடியவில்லை",
        "paymentFailedMsg": "கட்டணப் பரிவர்த்தனையை நிறைவு செய்ய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
        "downloadReceipt": "ரசீதை பதிவிறக்கு",
        "printReceipt": "ரசீதை அச்சிடு",
        "noDues": "நிலுவைத் தொகைகள் ஏதுமில்லை. நன்றி!",
        "dueDate": "கடைசி தேதி",
        "feeType": "கட்டண வகை",
        "invoiceNo": "இன்வாய்ஸ் எண்",
        "status": "நிலை",
        "amount": "தொகை",
        "due": "நிலுவை",
        "paid": "செலுத்தப்பட்டது",
        "checkoutTitle": "EDUCORE கட்டணச் செலுத்துதல்",
        "checkoutDesc": "ரேஸர்பே மூலம் பாதுகாப்பான ஆன்லைன் செலுத்துதல்"
    }
}

def update_file(filename, additions):
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for section, keys in additions.items():
        if section not in data:
            data[section] = {}
        for k, v in keys.items():
            data[section][k] = v
            
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {filename} successfully.")

if __name__ == '__main__':
    update_file('locales/en.json', en_adds)
    update_file('locales/ta.json', ta_adds)
