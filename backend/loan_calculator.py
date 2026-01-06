"""
Comprehensive Loan Calculator Engine
Supports multiple payment frequencies, extra payments, payment holidays, and detailed amortization schedules.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from decimal import Decimal, ROUND_HALF_UP

class LoanCalculator:
    """Advanced loan calculator with support for various payment scenarios"""
    
    PAYMENT_FREQUENCIES = {
        'monthly': 12,
        'bi-weekly': 26,
        'weekly': 52
    }
    
    def __init__(
        self,
        principal: float,
        annual_rate: float,
        tenure_months: int,
        payment_frequency: str = 'monthly',
        start_date: Optional[datetime] = None,
        loan_type: str = 'fixed',
        down_payment: float = 0,
        fees: Dict[str, float] = None
    ):
        """
        Initialize loan calculator
        
        Args:
            principal: Loan amount
            annual_rate: Annual interest rate (as percentage, e.g., 10.5)
            tenure_months: Loan tenure in months
            payment_frequency: 'monthly', 'bi-weekly', or 'weekly'
            start_date: Loan start date
            loan_type: 'fixed' or 'variable'
            down_payment: Down payment amount
            fees: Dictionary of fees (origination, processing, etc.)
        """
        self.principal = Decimal(str(principal))
        self.annual_rate = Decimal(str(annual_rate))
        self.tenure_months = tenure_months
        self.payment_frequency = payment_frequency
        self.start_date = start_date or datetime.now()
        self.loan_type = loan_type
        self.down_payment = Decimal(str(down_payment))
        self.fees = {k: Decimal(str(v)) for k, v in (fees or {}).items()}
        
        # Calculate derived values
        self.payments_per_year = self.PAYMENT_FREQUENCIES[payment_frequency]
        self.total_payments = self._calculate_total_payments()
        self.period_rate = self.annual_rate / Decimal('100') / Decimal(str(self.payments_per_year))
        
        # Adjust principal for down payment
        self.net_principal = self.principal - self.down_payment
        
    def _calculate_total_payments(self) -> int:
        """Calculate total number of payments based on frequency"""
        if self.payment_frequency == 'monthly':
            return self.tenure_months
        elif self.payment_frequency == 'bi-weekly':
            return int(self.tenure_months * 26 / 12)
        else:  # weekly
            return int(self.tenure_months * 52 / 12)
    
    def calculate_payment(self) -> Decimal:
        """Calculate regular payment amount using standard amortization formula"""
        if self.period_rate == 0:
            return self.net_principal / Decimal(str(self.total_payments))
        
        numerator = self.net_principal * self.period_rate * (1 + self.period_rate) ** self.total_payments
        denominator = (1 + self.period_rate) ** self.total_payments - 1
        
        payment = numerator / denominator
        return payment.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    def generate_amortization_schedule(
        self,
        extra_payments: List[Dict] = None,
        payment_holidays: List[Dict] = None
    ) -> List[Dict]:
        """
        Generate detailed amortization schedule
        
        Args:
            extra_payments: List of {payment_number: int, amount: float}
            payment_holidays: List of {start_payment: int, end_payment: int}
        
        Returns:
            List of payment details with principal, interest, and balance
        """
        schedule = []
        balance = self.net_principal
        regular_payment = self.calculate_payment()
        
        extra_payment_map = {}
        if extra_payments:
            for ep in extra_payments:
                extra_payment_map[ep['payment_number']] = Decimal(str(ep['amount']))
        
        holiday_periods = set()
        if payment_holidays:
            for ph in payment_holidays:
                holiday_periods.update(range(ph['start_payment'], ph['end_payment'] + 1))
        
        payment_date = self.start_date
        
        for payment_num in range(1, self.total_payments + 1):
            if balance <= 0:
                break
            
            # Skip if in payment holiday
            if payment_num in holiday_periods:
                schedule.append({
                    'payment_number': payment_num,
                    'payment_date': payment_date.strftime('%Y-%m-%d'),
                    'payment': Decimal('0'),
                    'principal': Decimal('0'),
                    'interest': Decimal('0'),
                    'extra_payment': Decimal('0'),
                    'balance': balance,
                    'is_holiday': True
                })
                payment_date = self._get_next_payment_date(payment_date)
                continue
            
            # Calculate interest for this period
            interest = (balance * self.period_rate).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            
            # Calculate principal portion
            principal = regular_payment - interest
            
            # Add extra payment if applicable
            extra = extra_payment_map.get(payment_num, Decimal('0'))
            
            # Ensure we don't overpay
            total_payment = principal + extra
            if total_payment > balance:
                total_payment = balance
                principal = balance - extra if extra < balance else balance
                extra = balance - principal if principal < balance else Decimal('0')
            
            # Update balance
            balance -= (principal + extra)
            balance = max(balance, Decimal('0'))
            
            schedule.append({
                'payment_number': payment_num,
                'payment_date': payment_date.strftime('%Y-%m-%d'),
                'payment': regular_payment,
                'principal': principal,
                'interest': interest,
                'extra_payment': extra,
                'balance': balance,
                'is_holiday': False
            })
            
            payment_date = self._get_next_payment_date(payment_date)
        
        return schedule
    
    def _get_next_payment_date(self, current_date: datetime) -> datetime:
        """Calculate next payment date based on frequency"""
        if self.payment_frequency == 'monthly':
            # Add one month
            if current_date.month == 12:
                return current_date.replace(year=current_date.year + 1, month=1)
            else:
                return current_date.replace(month=current_date.month + 1)
        elif self.payment_frequency == 'bi-weekly':
            return current_date + timedelta(days=14)
        else:  # weekly
            return current_date + timedelta(days=7)
    
    def calculate_summary(
        self,
        extra_payments: List[Dict] = None,
        payment_holidays: List[Dict] = None
    ) -> Dict:
        """
        Calculate loan summary with all key metrics
        
        Returns:
            Dictionary with total interest, total cost, monthly payment, etc.
        """
        schedule = self.generate_amortization_schedule(extra_payments, payment_holidays)
        regular_payment = self.calculate_payment()
        
        total_interest = sum(Decimal(str(p['interest'])) for p in schedule)
        total_extra = sum(Decimal(str(p['extra_payment'])) for p in schedule)
        total_fees = sum(self.fees.values())
        
        total_paid = sum(
            Decimal(str(p['payment'])) + Decimal(str(p['extra_payment'])) 
            for p in schedule if not p['is_holiday']
        )
        
        return {
            'regular_payment': float(regular_payment),
            'total_payments': len(schedule),
            'actual_payments': len([p for p in schedule if not p['is_holiday']]),
            'total_principal': float(self.net_principal),
            'total_interest': float(total_interest),
            'total_extra_payments': float(total_extra),
            'total_fees': float(total_fees),
            'total_cost': float(self.net_principal + total_interest + total_fees),
            'total_paid': float(total_paid),
            'down_payment': float(self.down_payment),
            'original_principal': float(self.principal),
            'payment_frequency': self.payment_frequency,
            'annual_rate': float(self.annual_rate),
            'tenure_months': self.tenure_months,
            'loan_type': self.loan_type
        }
    
    def calculate_affordability(self, monthly_income: float) -> Dict:
        """
        Calculate affordability metrics
        
        Args:
            monthly_income: User's monthly income
        
        Returns:
            Affordability analysis
        """
        regular_payment = self.calculate_payment()
        
        # Convert payment to monthly equivalent
        if self.payment_frequency == 'monthly':
            monthly_payment = regular_payment
        elif self.payment_frequency == 'bi-weekly':
            monthly_payment = regular_payment * Decimal('26') / Decimal('12')
        else:  # weekly
            monthly_payment = regular_payment * Decimal('52') / Decimal('12')
        
        monthly_income_decimal = Decimal(str(monthly_income))
        debt_to_income_ratio = (monthly_payment / monthly_income_decimal * 100) if monthly_income_decimal > 0 else Decimal('0')
        
        # Standard affordability thresholds
        is_affordable = debt_to_income_ratio <= 43  # 43% is common threshold
        comfort_level = 'comfortable' if debt_to_income_ratio <= 28 else \
                       'manageable' if debt_to_income_ratio <= 36 else \
                       'stretched' if debt_to_income_ratio <= 43 else 'risky'
        
        return {
            'monthly_payment_equivalent': float(monthly_payment),
            'monthly_income': monthly_income,
            'debt_to_income_ratio': float(debt_to_income_ratio),
            'is_affordable': is_affordable,
            'comfort_level': comfort_level,
            'recommended_max_payment': float(monthly_income_decimal * Decimal('0.28'))
        }


def calculate_loan(params: Dict) -> Dict:
    """
    Main function to calculate loan details
    
    Args:
        params: Dictionary with loan parameters
    
    Returns:
        Complete loan analysis including schedule and summary
    """
    calculator = LoanCalculator(
        principal=params['principal'],
        annual_rate=params['annual_rate'],
        tenure_months=params['tenure_months'],
        payment_frequency=params.get('payment_frequency', 'monthly'),
        start_date=datetime.fromisoformat(params['start_date']) if params.get('start_date') else None,
        loan_type=params.get('loan_type', 'fixed'),
        down_payment=params.get('down_payment', 0),
        fees=params.get('fees', {})
    )
    
    extra_payments = params.get('extra_payments', [])
    payment_holidays = params.get('payment_holidays', [])
    
    summary = calculator.calculate_summary(extra_payments, payment_holidays)
    schedule = calculator.generate_amortization_schedule(extra_payments, payment_holidays)
    
    # Calculate affordability if income provided
    affordability = None
    if params.get('monthly_income'):
        affordability = calculator.calculate_affordability(params['monthly_income'])
    
    return {
        'summary': summary,
        'schedule': [
            {
                **entry,
                'payment': float(entry['payment']),
                'principal': float(entry['principal']),
                'interest': float(entry['interest']),
                'extra_payment': float(entry['extra_payment']),
                'balance': float(entry['balance'])
            }
            for entry in schedule
        ],
        'affordability': affordability
    }
