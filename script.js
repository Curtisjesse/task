        const rates = { USD_KES: 150.5, USD_NGN: 785.2, KES_USD: 0.00664, KES_NGN: 5.22, NGN_USD: 0.00127, NGN_KES: 0.19 };
        
        let accounts = [
            { id: 'mpesa1', name: 'Mpesa KES 1', currency: 'KES', balance: 500000 },
            { id: 'mpesa2', name: 'Mpesa KES 2', currency: 'KES', balance: 220000 },
            { id: 'bank_kes', name: 'Bank KES', currency: 'KES', balance: 450000 },
            { id: 'bank_usd1', name: 'Bank USD 1', currency: 'USD', balance: 25000 },
            { id: 'bank_usd2', name: 'Bank USD 2', currency: 'USD', balance: 18750 },
            { id: 'bank_usd3', name: 'Bank USD 3', currency: 'USD', balance: 25000 },
            { id: 'bank_ngn1', name: 'Bank NGN 1', currency: 'NGN', balance: 4500000 },
            { id: 'bank_ngn2', name: 'Bank NGN 2', currency: 'NGN', balance: 3800000 },
            { id: 'wallet_ngn', name: 'Wallet NGN', currency: 'NGN', balance: 1000000 },
            { id: 'wallet_usd', name: 'Wallet USD', currency: 'USD', balance: 8500 }
        ];
        
        let transactions = [];
        let selected = null;

        function init() {
            renderAccounts();
            populateSelects();
            updateStats();
            setupEvents();
        }

        function renderAccounts() {
            const container = document.getElementById('accounts');
            container.innerHTML = accounts.map(acc => `
                <div class="account ${acc.id === selected ? 'selected' : ''}" onclick="selectAccount('${acc.id}')">
                    <div class="account-name">${acc.name}</div>
                    <div class="account-balance">${formatMoney(acc.balance, acc.currency)}</div>
                    <span class="currency ${acc.currency.toLowerCase()}">${acc.currency}</span>
                </div>
            `).join('');
        }

        function populateSelects() {
            const fromSelect = document.getElementById('from-account');
            const toSelect = document.getElementById('to-account');
            
            fromSelect.innerHTML = '<option value="">Select source</option>' + 
                accounts.map(acc => `<option value="${acc.id}">${acc.name} (${formatMoney(acc.balance, acc.currency)})</option>`).join('');
                
            toSelect.innerHTML = '<option value="">Select destination</option>' + 
                accounts.map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('');
        }

        function selectAccount(id) {
            selected = id;
            document.getElementById('from-account').value = id;
            renderAccounts();
            updateToOptions();
            validate();
        }

        function setupEvents() {
            document.getElementById('from-account').onchange = () => { updateToOptions(); validate(); updateFX(); };
            document.getElementById('to-account').onchange = () => { validate(); updateFX(); };
            document.getElementById('amount').oninput = () => { validate(); updateFX(); };
        }

        function updateToOptions() {
            const fromId = document.getElementById('from-account').value;
            const toSelect = document.getElementById('to-account');
            toSelect.innerHTML = '<option value="">Select destination</option>' + 
                accounts.filter(acc => acc.id !== fromId).map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('');
        }

        function validate() {
            const fromId = document.getElementById('from-account').value;
            const toId = document.getElementById('to-account').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const btn = document.getElementById('transfer-btn');
            const msg = document.getElementById('message');
            
            if (!fromId || !toId || !amount || amount <= 0) {
                btn.disabled = true;
                msg.innerHTML = '';
                return;
            }
            
            const fromAcc = accounts.find(a => a.id === fromId);
            if (amount > fromAcc.balance) {
                btn.disabled = true;
                msg.innerHTML = '<div class="message error">Insufficient funds</div>';
                return;
            }
            
            btn.disabled = false;
            msg.innerHTML = '';
        }

        function updateFX() {
            const fromId = document.getElementById('from-account').value;
            const toId = document.getElementById('to-account').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const info = document.getElementById('fx-info');
            
            if (!fromId || !toId || !amount) {
                info.innerHTML = '';
                return;
            }
            
            const fromAcc = accounts.find(a => a.id === fromId);
            const toAcc = accounts.find(a => a.id === toId);
            
            if (fromAcc.currency !== toAcc.currency) {
                const rate = getRate(fromAcc.currency, toAcc.currency);
                const converted = amount * rate;
                info.innerHTML = `Converts to ${formatMoney(converted, toAcc.currency)} (Rate: ${rate.toFixed(4)})`;
            } else {
                info.innerHTML = '';
            }
        }

        function getRate(from, to) {
            return from === to ? 1 : rates[`${from}_${to}`] || 1;
        }

        function transfer() {
            const fromId = document.getElementById('from-account').value;
            const toId = document.getElementById('to-account').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const note = document.getElementById('note').value || 'Transfer';
            
            const fromAcc = accounts.find(a => a.id === fromId);
            const toAcc = accounts.find(a => a.id === toId);
            const rate = getRate(fromAcc.currency, toAcc.currency);
            const converted = amount * rate;
            
            fromAcc.balance -= amount;
            toAcc.balance += converted;
            
            transactions.unshift({
                id: 'TXN' + Date.now().toString(36).toUpperCase(),
                time: new Date().toLocaleString(),
                from: fromAcc.name,
                to: toAcc.name,
                amount: amount,
                converted: converted,
                fromCurrency: fromAcc.currency,
                toCurrency: toAcc.currency,
                note: note
            });
            
            renderAccounts();
            populateSelects();
            updateStats();
            renderTransactions();
            resetForm();
            
            document.getElementById('message').innerHTML = '<div class="message success">Transfer completed successfully!</div>';
            setTimeout(() => document.getElementById('message').innerHTML = '', 3000);
        }

        function renderTransactions() {
            const container = document.getElementById('transactions-list');
            if (transactions.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">No transactions yet</p>';
                return;
            }
            
            container.innerHTML = transactions.slice(0, 5).map(tx => `
                <div class="transaction">
                    <div class="tx-header">
                        <span>${tx.id}</span>
                        <span>${tx.time}</span>
                    </div>
                    <div>${tx.from} → ${tx.to}</div>
                    <div>
                        ${formatMoney(tx.amount, tx.fromCurrency)}
                        ${tx.fromCurrency !== tx.toCurrency ? ` → ${formatMoney(tx.converted, tx.toCurrency)}` : ''}
                    </div>
                    <div style="font-size: 12px; color: #64748b;">${tx.note}</div>
                </div>
            `).join('');
        }

        function updateStats() {
            let totalUSD = 0;
            accounts.forEach(acc => {
                totalUSD += acc.currency === 'USD' ? acc.balance : acc.balance * getRate(acc.currency, 'USD');
            });
            
            document.getElementById('total-balance').textContent = formatMoney(totalUSD, 'USD');
            document.getElementById('total-transfers').textContent = transactions.length;
        }

        function formatMoney(amount, currency) {
            const formatters = {
                USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
                KES: new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }),
                NGN: new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })
            };
            return formatters[currency]?.format(amount) || `${currency} ${amount.toFixed(2)}`;
        }

        function resetForm() {
            document.getElementById('from-account').value = '';
            document.getElementById('to-account').value = '';
            document.getElementById('amount').value = '';
            document.getElementById('note').value = '';
            document.getElementById('fx-info').innerHTML = '';
            selected = null;
            renderAccounts();
            validate();
        }

        init();