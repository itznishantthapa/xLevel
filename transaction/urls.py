from django.urls import path

from .views.transaction_views import (
    transaction_credit,
    transaction_withdraw,
    user_transaction_on_loads,
    create_dynamic_transaction
)

app_name = 'transaction'

urlpatterns = [
    path('in/', transaction_credit, name='transaction_credit'),
    path('out/', transaction_withdraw, name='transaction_withdraw'),
    path('history/', user_transaction_on_loads, name='transaction_history'),
    path('create-dynamic-transaction/', create_dynamic_transaction, name='create_dynamic_transaction'),
]