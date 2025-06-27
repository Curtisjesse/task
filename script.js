
        // Exchange rates (static for demo purposes)
        const FX_RATES = {
            'USD_KES': 150.50,
            'USD_NGN': 785.20,
            'KES_USD': 0.00664,
            'KES_NGN': 5.22,
            'NGN_USD': 0.00127,
            'NGN_KES': 0.19
        };

        // Initialize accounts
        let accounts = [
            { id: 'mpesa_kes_1', name: 'Mpesa_KES_1', currency: 'KES', balance: 250000.00 },
            { id: 'mpesa_kes_2', name: 'Mpesa_KES_2', currency: 'KES', balance: 180000.00 },
            { id: 'bank_kes_1', name: 'Bank_KES_1', currency: 'KES', balance: 450000.00 },
            { id: 'bank_usd_1', name: 'Bank_USD_1', currency: 'USD', balance: 12500.00 },
            { id: 'bank_usd_2', name: 'Bank_USD_2', currency: 'USD', balance: 8750.00 },
            { id: 'bank_usd_3', name: 'Bank_USD_3', currency: 'USD', balance: 15000.00 },
            { id: 'bank_ngn_1', name: 'Bank_NGN_1', currency: 'NGN', balance: 2500000.00 },
            { id: 'bank_ngn_2', name: 'Bank_NGN_2', currency: 'NGN', balance: 1800000.00 },
            { id: 'wallet_ngn_1', name: 'Wallet_NGN_1', currency: 'NGN', balance: 950000.00 },
            { id: 'wallet_usd_1', name: 'Wallet_USD_1', currency: 'USD', balance: 5500.00 }
        ];

        let transactions = [];
        let selectedFromAccount = null;
        let selectedToAccount = null;

        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            renderAccounts();
            populateAccountSelects();
            updateSummaryStats();
            setDefaultTransferDate();
            setupEventListeners();
        });

        function renderAccounts() {
            const grid = document.getElementById('accounts-grid');
            grid.innerHTML = '';

            accounts.forEach(account => {
                const card = document.createElement('div');
                card.className = `account-card ${account.currency.toLowerCase()}`;
                card.setAttribute('data-account-id', account.id);
                card.innerHTML = `
                    <div class="account-name">${account.name}</div>
                    <div class="account-balance">${formatCurrency(account.balance, account.currency)}</div>
                    <div class="account-currency">${account.currency} Account</div>
                `;
                
                card.addEventListener('click', () => selectAccount(account.id));
                grid.appendChild(card);
            });
        }

        function populateAccountSelects() {
            const fromSelect = document.getElementById('from-account');
            const toSelect = document.getElementById('to-account');
            const accountFilter = document.getElementById('account-filter');

            // Clear existing options
            fromSelect.innerHTML = '<option value="">Select source account</option>';
            toSelect.innerHTML = '<option value="">Select destination account</option>';
            accountFilter.innerHTML = '<option value="">All Accounts</option>';

            accounts.forEach(account => {
                const option1 = new Option(`${account.name} (${formatCurrency(account.balance, account.currency)})`, account.id);
                const option2 = new Option(`${account.name} (${formatCurrency(account.balance, account.currency)})`, account.id);
                const option3 = new Option(account.name, account.id);
                
                fromSelect.appendChild(option1);
                toSelect.appendChild(option2);
                accountFilter.appendChild(option3);
            });
        }

        function selectAccount(accountId) {
            // Remove previous selections
            document.querySelectorAll('.account-card').forEach(card => {
                card.classList.remove('selected');
            });

            // Add selection to clicked account
            const clickedCard = document.querySelector(`[data-account-id="${accountId}"]`);
            if (clickedCard) {
                clickedCard.classList.add('selected');
            }

            // Auto-fill form if no source selected
            const fromSelect = document.getElementById('from-account');
            if (!fromSelect.value) {
                fromSelect.value = accountId;
                selectedFromAccount = accountId;
                updateTransferValidation();
            }
        }

        function setupEventListeners() {
            const fromAccount = document.getElementById('from-account');
            const toAccount = document.getElementById('to-account');
            const transferAmount = document.getElementById('transfer-amount');
            const accountFilter = document.getElementById('account-filter');
            const currencyFilter = document.getElementById('currency-filter');

            fromAccount.addEventListener('change', function() {
                selectedFromAccount = this.value;
                updateToAccountOptions();
                updateTransferValidation();
                calculateFXConversion();
            });

            toAccount.addEventListener('change', function() {
                selectedToAccount = this.value;
                updateTransferValidation();
                calculateFXConversion();
            });

            transferAmount.addEventListener('input', function() {
                updateTransferValidation();
                calculateFXConversion();
            });

            accountFilter.addEventListener('change', filterTransactions);
            currencyFilter.addEventListener('change', filterTransactions);
        }

        function updateToAccountOptions() {
            const toSelect = document.getElementById('to-account');
            const fromAccountId = selectedFromAccount;
            
            // Clear and repopulate to-account options
            toSelect.innerHTML = '<option value="">Select destination account</option>';
            
            accounts.forEach(account => {
                if (account.id !== fromAccountId) {
                    const option = new Option(`${account.name} (${formatCurrency(account.balance, account.currency)})`, account.id);
                    toSelect.appendChild(option);
                }
            });
        }

        function updateTransferValidation() {
            const transferBtn = document.getElementById('transfer-btn');
            const amount = parseFloat(document.getElementById('transfer-amount').value);
            
            let isValid = true;
            let errorMessage = '';

            if (!selectedFromAccount || !selectedToAccount) {
                isValid = false;
                errorMessage = 'Please select both source and destination accounts';
            } else if (!amount || amount <= 0) {
                isValid = false;
                errorMessage = 'Please enter a valid amount';
            } else {
                const fromAccount = accounts.find(acc => acc.id === selectedFromAccount);
                if (fromAccount && amount > fromAccount.balance) {
                    isValid = false;
                    errorMessage = `Insufficient funds. Available: ${formatCurrency(fromAccount.balance, fromAccount.currency)}`;
                }
            }

            transferBtn.disabled = !isValid;
            
            const messageDiv = document.getElementById('transfer-message');
            if (!isValid && errorMessage) {
                messageDiv.innerHTML = `<div class="error-message">${errorMessage}</div>`;
            } else {
                messageDiv.innerHTML = '';
            }
        }

        function calculateFXConversion() {
            const fromAccountId = selectedFromAccount;
            const toAccountId = selectedToAccount;
            const amount = parseFloat(document.getElementById('transfer-amount').value);
            const infoDiv = document.getElementById('fx-conversion-info');

            if (!fromAccountId || !toAccountId || !amount) {
                infoDiv.innerHTML = '';
                return;
            }

            const fromAccount = accounts.find(acc => acc.id === fromAccountId);
            const toAccount = accounts.find(acc => acc.id === toAccountId);

            if (fromAccount.currency !== toAccount.currency) {
                const rate = getFXRate(fromAccount.currency, toAccount.currency);
                const convertedAmount = amount * rate;
                
                infoDiv.innerHTML = `
                    <div class="fx-rate-info">
                        💱 FX Conversion: ${formatCurrency(amount, fromAccount.currency)} → ${formatCurrency(convertedAmount, toAccount.currency)}
                        <br>Rate: 1 ${fromAccount.currency} = ${rate.toFixed(4)} ${toAccount.currency}
                    </div>
                `;
            } else {
                infoDiv.innerHTML = '';
            }
        }

        function getFXRate(fromCurrency, toCurrency) {
            if (fromCurrency === toCurrency) return 1;
            const key = `${fromCurrency}_${toCurrency}`;
            return FX_RATES[key] || 1;
        }

        function processTransfer() {
            const fromAccountId = selectedFromAccount;
            const toAccountId = selectedToAccount;
            const amount = parseFloat(document.getElementById('transfer-amount').value);
            const note = document.getElementById('transfer-note').value;
            const transferDate = document.getElementById('transfer-date').value;

            const fromAccount = accounts.find(acc => acc.id === fromAccountId);
            const toAccount = accounts.find(acc => acc.id === toAccountId);

            // Calculate conversion if needed
            let debitAmount = amount;
            let creditAmount = amount;
            
            if (fromAccount.currency !== toAccount.currency) {
                creditAmount = amount * getFXRate(fromAccount.currency, toAccount.currency);
            }

            // Execute transfer
            fromAccount.balance -= debitAmount;
            toAccount.balance += creditAmount;

            // Create transaction record
            const transaction = {
                id: generateTransactionId(),
                timestamp: new Date(transferDate || Date.now()),
                fromAccount: fromAccount.name,
                toAccount: toAccount.name,
                fromCurrency: fromAccount.currency,
                toCurrency: toAccount.currency,
                debitAmount: debitAmount,
                creditAmount: creditAmount,
                note: note || 'Fund transfer',
                status: new Date(transferDate || Date.now()) > new Date() ? 'Pending' : 'Completed'
            };

            transactions.unshift(transaction);

            // Update UI
            renderAccounts();
            populateAccountSelects();
            updateSummaryStats();
            renderTransactions();
            resetTransferForm();

            // Show success message
            const messageDiv = document.getElementById('transfer-message');
            messageDiv.innerHTML = `<div class="success-message">✅ Transfer completed successfully! Transaction ID: ${transaction.id}</div>`;
            
            setTimeout(() => {
                messageDiv.innerHTML = '';
            }, 5000);
        }

        function generateTransactionId() {
            return 'TXN' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
        }

        function resetTransferForm() {
            document.getElementById('from-account').value = '';
            document.getElementById('to-account').value = '';
            document.getElementById('transfer-amount').value = '';
            document.getElementById('transfer-note').value = '';
            document.getElementById('fx-conversion-info').innerHTML = '';
            
            selectedFromAccount = null;
            selectedToAccount = null;
            
            document.querySelectorAll('.account-card').forEach(card => {
                card.classList.remove('selected');
            });
            
            setDefaultTransferDate();
        }

        function setDefaultTransferDate() {
            const now = new Date();
            const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            document.getElementById('transfer-date').value = localDateTime;
        }

        function renderTransactions() {
            const container = document.getElementById('transactions-container');
            
            if (transactions.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No transactions yet. Start by making a transfer!</p></div>';
                return;
            }

            const table = document.createElement('table');
            table.className = 'transactions-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Transaction ID</th>
                        <th>Date/Time</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Amount</th>
                        <th>Note</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.map(tx => `
                        <tr>
                            <td><span class="transaction-id">${tx.id}</span></td>
                            <td>${new Date(tx.timestamp).toLocaleString()}</td>
                            <td>${tx.fromAccount} <span class="currency-badge currency-${tx.fromCurrency.toLowerCase()}">${tx.fromCurrency}</span></td>
                            <td>${tx.toAccount} <span class="currency-badge currency-${tx.toCurrency.toLowerCase()}">${tx.toCurrency}</span></td>
                            <td>
                                <span class="amount-negative">-${formatCurrency(tx.debitAmount, tx.fromCurrency)}</span>
                                ${tx.fromCurrency !== tx.toCurrency ? `<br><span class="amount-positive">+${formatCurrency(tx.creditAmount, tx.toCurrency)}</span>` : ''}
                            </td>
                            <td>${tx.note}</td>
                            <td><span class="status-${tx.status.toLowerCase()}">${tx.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
            
            container.innerHTML = '';
            container.appendChild(table);
        }

        function filterTransactions() {
            const accountFilter = document.getElementById('account-filter').value;
            const currencyFilter = document.getElementById('currency-filter').value;
            
            let filteredTransactions = transactions;
            
            if (accountFilter) {
                const selectedAccount = accounts.find(acc => acc.id === accountFilter);
                if (selectedAccount) {
                    filteredTransactions = filteredTransactions.filter(tx => 
                        tx.fromAccount === selectedAccount.name || tx.toAccount === selectedAccount.name
                    );
                }
            }
            
            if (currencyFilter) {
                filteredTransactions = filteredTransactions.filter(tx => 
                    tx.fromCurrency === currencyFilter || tx.toCurrency === currencyFilter
                );
            }
            
            renderFilteredTransactions(filteredTransactions);
        }

        function renderFilteredTransactions(filteredTransactions) {
            const container = document.getElementById('transactions-container');
            
            if (filteredTransactions.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No transactions match the selected filters.</p></div>';
                return;
            }

            const table = document.createElement('table');
            table.className = 'transactions-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Transaction ID</th>
                        <th>Date/Time</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Amount</th>
                        <th>Note</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredTransactions.map(tx => `
                        <tr>
                            <td><span class="transaction-id">${tx.id}</span></td>
                            <td>${new Date(tx.timestamp).toLocaleString()}</td>
                            <td>${tx.fromAccount} <span class="currency-badge currency-${tx.fromCurrency.toLowerCase()}">${tx.fromCurrency}</span></td>
                            <td>${tx.toAccount} <span class="currency-badge currency-${tx.toCurrency.toLowerCase()}">${tx.toCurrency}</span></td>
                            <td>
                                <span class="amount-negative">-${formatCurrency(tx.debitAmount, tx.fromCurrency)}</span>
                                ${tx.fromCurrency !== tx.toCurrency ? `<br><span class="amount-positive">+${formatCurrency(tx.creditAmount, tx.toCurrency)}</span>` : ''}
                            </td>
                            <td>${tx.note}</td>
                            <td><span class="status-${tx.status.toLowerCase()}">${tx.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
            
            container.innerHTML = '';
            container.appendChild(table);
        }

        function updateSummaryStats() {
            // Calculate total balance in USD
            let totalBalanceUSD = 0;
            accounts.forEach(account => {
                if (account.currency === 'USD') {
                    totalBalanceUSD += account.balance;
                } else {
                    totalBalanceUSD += account.balance * getFXRate(account.currency, 'USD');
                }
            });

            document.getElementById('total-balance').textContent = formatCurrency(totalBalanceUSD, 'USD');
            document.getElementById('total-transfers').textContent = transactions.length;
        }

        function formatCurrency(amount, currency) {
            const formatters = {
                'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
                'KES': new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }),
                'NGN': new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })
            };
            
            return formatters[currency] ? formatters[currency].format(amount) : `${currency} ${amount.toFixed(2)}`;
        }

        function clearTransactions() {
            if (confirm('Are you sure you want to clear all transaction history? This action cannot be undone.')) {
                transactions = [];
                renderTransactions();
                updateSummaryStats();
            }
        }
    