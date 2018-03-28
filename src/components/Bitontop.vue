<template>
    <div class="content">
        <div class="send-eth">
            <h3>To Address</h3>
            <input type="text" placeholder="0xaA2b80c171D18aF2343D7678ff15B0d6CF635964" v-model="toAddress"
                   :class="{error: !toAddress || toAddress.length === 0}">
            <h3>Amount to Send</h3>
            <input type="number" placeholder="Amount" v-model="amount" min="0" :class="{error: !amount || amount <= 0}">
            <h3>Gas Price (Gwei)</h3>
            <input type="number" placeholder="41" v-model="gasPrice" min="0"
                   :class="{error: !gasPrice || gasPrice <= 0}">
            <h3>Gas Limit</h3>
            <input type="number" placeholder="21000" v-model="gasLimit" min="0"
                   :class="{error: !gasLimit || gasLimit <= 0}">
            <h3>Data (optional)</h3>
            <input type="text" placeholder="0x6d79657468657277616c6c65742e636f6d20697320746865206265737421"
                   v-model="data">
            <button @click="generateTransaction">Generate Transaction</button>
            <h3 v-if="rawTransaction">Raw Transaction</h3>
            <pre v-if="rawTransaction">{{rawTransaction}}</pre>
            <h3 v-if="signedTransaction">Signed Transaction</h3>
            <pre v-if="signedTransaction">{{signedTransaction}}</pre>
            <button @click="sendTransaction" v-if="signedTransaction">Send Transaction</button>
        </div>
        <div class="account-info">
            <h3>Account Address</h3>
            <p>{{accountAddress}}</p>
            <h3>Account Balance</h3>
            <p>{{ethBalance}} ROPSTEN ETH</p>
            <h3>Transaction History</h3>
            <p><a :href="'https://ropsten.etherscan.io/address/' + accountAddress" target="_blank">ROPSTEN ETH
                (https://ropsten.etherscan.io)</a></p>
        </div>
    </div>
</template>

<script>
    let Web3 = require('web3')
    let web3 = window.web3
    export default {
        name: 'Bitontop',
        data() {
            return {
                nonce: 0,
                gasLimit: 21000,
                gasPrice: 41,
                data: '',
                toAddress: '',
                amount: undefined,
                accountAddress: '',
                ethBalance: undefined,
                rawTransaction: undefined,
                signedTransaction: undefined
            }
        },
        methods: {
            async generateTransaction() {
                if (!this.toAddress || this.toAddress.length === 0 || !this.amount || this.amount <= 0 || this.gasPrice <= 0 || this.gasLimit <= 0) {
                    alert('please check the fields')
                    return
                }
                let count = await web3.eth.getTransactionCount(this.accountAddress)
                this.rawTransaction = {
                    nonce: web3.utils.toHex(count),
                    gasPrice: web3.utils.toHex(web3.utils.toWei(new web3.utils.BN(this.gasPrice), 'Gwei')),
                    gasLimit: web3.utils.toHex(this.gasLimit),
                    to: this.toAddress,
                    value: web3.utils.toHex(web3.utils.toWei(new web3.utils.BN(this.amount))),
                    data: this.data
                }
                this.signedTransaction = {
                    from: this.accountAddress,
                    nonce: web3.utils.toHex(count),
                    gasPrice: web3.utils.toHex(web3.utils.toWei(new web3.utils.BN(this.gasPrice), 'Gwei')),
                    gasLimit: web3.utils.toHex(this.gasLimit),
                    to: this.toAddress,
                    value: web3.utils.toHex(web3.utils.toWei(new web3.utils.BN(this.amount))),
                    data: this.data
                }
            },
            sendTransaction() {
                web3.eth.sendTransaction(this.signedTransaction).on('transactionHash', (hash) => {
                    alert('success, with hash ' + hash)
                })
                this.rawTransaction = undefined
                this.signedTransaction = undefined
            }
        },
        mounted: function () {
            if (typeof web3 !== 'undefined' && web3.currentProvider.isMetaMask) {
                web3 = new Web3(web3.currentProvider)
                web3.eth.getAccounts().then(async (accounts) => {
                    this.accountAddress = accounts[0]
                    web3.eth.getBalance(this.accountAddress).then((res) => {
                        this.ethBalance = web3.utils.fromWei(res)
                    })
                })
            } else {
                alert('not connected to metamask!')
            }
        }
    }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
    .content {
        width: 1200px;
        max-width: 100%;
        margin: auto;
        word-break: break-all;
    }

    input {
        display: block;
        width: 100%;
        height: 2.55rem;
        padding: .25rem 1rem;
        font-size: 1rem;
        line-height: 2;
        color: #333;
        background: #fff none;
        border: 1px solid #ececec;
        margin-top: .5rem;
        margin-bottom: .5rem;
        &.error {
            border-color: #f7b7b3;
        }
    }

    button {
        cursor: pointer;
        font-weight: 400;
        letter-spacing: .05em;
        margin-top: 1rem;
        margin-bottom: 0;
        text-align: center;
        touch-action: manipulation;
        vertical-align: middle;
        white-space: nowrap;
        padding: .75rem 2rem;
        font-size: 1.07rem;
        line-height: 1.4;
        border-radius: 0;
        user-select: none;
        color: #fff;
        background: #163151 none;
        border: 1px solid #163151;
        display: block;
        width: 100%;
    }

    .send-eth {
        display: inline-block;
        background-color: #fff;
        box-shadow: 16px 16px 47px 2px rgba(0, 0, 0, .07);
        padding: 1.5rem 2rem;
        min-height: 1.5rem;
        margin: 1rem 1rem 1rem auto;
        position: relative;
        width: 65%;
        vertical-align: top;
    }

    .account-info {
        display: inline-block;
        background-color: #fff;
        box-shadow: 16px 16px 47px 2px rgba(0, 0, 0, .07);
        padding: 1.5rem 2rem;
        min-height: 1.5rem;
        margin: 1rem auto;
        position: relative;
        width: calc(35% - 2rem);
        vertical-align: top;
    }
</style>
