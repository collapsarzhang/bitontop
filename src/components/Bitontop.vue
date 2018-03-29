<template>
    <div class="content">
        <div class="send-eth">
            <h3>To Address</h3>
            <input type="text" placeholder="0xaA2b80c171D18aF2343D7678ff15B0d6CF635964" v-model="toAddress"
                   :class="{error: !toAddress || toAddress.length === 0}">
            <h3>Token/Coin to Send</h3>
            <select v-model="transferringToken">
                <option v-for="token in transferrableTokens" :key="token.symbol" v-bind:value="token">
                    {{ token.symbol }}
                </option>
            </select>
            <h3>Amount to Send</h3>
            <input type="number" placeholder="Amount" v-model="amount" min="0" :class="{error: !amount || amount <= 0}">
            <h3>Gas Price (Gwei)</h3>
            <input type="number" placeholder="41" v-model="gasPrice" min="0"
                   :class="{error: !gasPrice || gasPrice <= 0}">
            <div v-show="!transferringToken || transferringToken.symbol === 'ETH'">
                <h3>Gas Limit</h3>
                <input type="number" placeholder="21000" v-model="gasLimit" min="0"
                       :class="{error: !gasLimit || gasLimit <= 0}">
                <h3>Data (optional)</h3>
                <input type="text" placeholder="0x6d79657468657277616c6c65742e636f6d20697320746865206265737421"
                       v-model="data">
            </div>
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
        <div class="add-token">
            <h3>Token Balances</h3>
            <button @click="addingToken = !addingToken">Add Custom Token</button>
            <div v-if="addingToken">
                <h3>Token Contract Address</h3>
                <input type="text" placeholder="0xDECAF9CD2367cdbb726E904cD6397eDFcAe6068D"
                       v-model="token.contractAddress"
                       :class="{error: !token.contractAddress || token.contractAddress.length === 0}">
                <h3>Token Symbol</h3>
                <input type="text" placeholder="" v-model="token.symbol"
                       :class="{error: !token.symbol || token.symbol.length === 0}">
                <h3>Decimals</h3>
                <input type="number" placeholder="" v-model="token.decimals" min="0"
                       :class="{error: !token.decimals || token.decimals <= 0}">
                <button @click="addToken">Save</button>
            </div>
            <div v-for="token in tokens" :key="token.contractAddress" class="token">

                <h4><img @click="removeToken(token)" class="delete-token"
                         src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAxMjkgMTI5IiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCAxMjkgMTI5IiB3aWR0aD0iMjRweCIgaGVpZ2h0PSIyNHB4Ij4KICA8Zz4KICAgIDxnPgogICAgICA8cGF0aCBkPSJtNjQuNSwxMjIuNGMzMS45LDAgNTcuOS0yNiA1Ny45LTU3LjlzLTI2LTU3LjktNTcuOS01Ny45LTU3LjksMjYtNTcuOSw1Ny45IDI2LDU3LjkgNTcuOSw1Ny45em0wLTEwNy43YzI3LjQtMy41NTI3MWUtMTUgNDkuOCwyMi4zIDQ5LjgsNDkuOHMtMjIuMyw0OS44LTQ5LjgsNDkuOC00OS44LTIyLjQtNDkuOC00OS44IDIyLjQtNDkuOCA0OS44LTQ5Ljh6IiBmaWxsPSIjMDAwMDAwIi8+CiAgICAgIDxwYXRoIGQ9Ik0zNy44LDY4aDUzLjNjMi4zLDAsNC4xLTEuOCw0LjEtNC4xcy0xLjgtNC4xLTQuMS00LjFIMzcuOGMtMi4zLDAtNC4xLDEuOC00LjEsNC4xUzM1LjYsNjgsMzcuOCw2OHoiIGZpbGw9IiMwMDAwMDAiLz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPgo="/>{{token.amount}}&nbsp;{{token.symbol}}
                </h4>
            </div>
        </div>
    </div>
</template>

<script>
    let Web3 = require('web3')
    let web3 = window.web3
    let abi = require('@/assets/abi.json')
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
                signedTransaction: undefined,
                addingToken: false,
                token: {},
                tokens: [],
                transferringToken: undefined,
                transferrableTokens: []
            }
        },
        methods: {
            async generateTransaction() {
                if (!this.toAddress || this.toAddress.length === 0 || !this.amount || this.amount <= 0 || this.gasPrice <= 0 || this.gasLimit <= 0) {
                    alert('please check the fields')
                    return
                }
                let count = await web3.eth.getTransactionCount(this.accountAddress)
                if (this.transferringToken.symbol === 'ETH') {
                    this.rawTransaction = {
                        nonce: web3.utils.toHex(count),
                        gasPrice: web3.utils.toHex(web3.utils.toWei(new web3.utils.BN(this.gasPrice), 'Gwei')),
                        gasLimit: web3.utils.toHex(this.gasLimit),
                        to: this.toAddress,
                        value: web3.utils.toHex(web3.utils.toWei(new web3.utils.BN(this.amount))),
                        data: this.data,
                        chainId: web3.utils.toHex(3)
                    }
                    this.signedTransaction = {
                        from: this.accountAddress,
                        nonce: web3.utils.toHex(count),
                        gasPrice: web3.utils.toHex(web3.utils.toWei(new web3.utils.BN(this.gasPrice), 'Gwei')),
                        gasLimit: web3.utils.toHex(this.gasLimit),
                        to: this.toAddress,
                        value: web3.utils.toHex(web3.utils.toWei(new web3.utils.BN(this.amount))),
                        data: this.data,
                        chainId: web3.utils.toHex(3)
                    }
                } else {
                    let contract = new web3.eth.Contract(abi, this.transferringToken.contractAddress, {
                        from: this.accountAddress,
                        gasPrice: web3.utils.toHex(web3.utils.toWei(new web3.utils.BN(this.gasPrice), 'Gwei'))
                    })
                    let data = contract.methods.transfer(this.toAddress, this.amount * 1.0 * (10 ** this.transferringToken.decimals)).encodeABI()
                    this.rawTransaction = {
                        nonce: web3.utils.toHex(count),
                        gasPrice: web3.utils.toHex(web3.utils.toWei(new web3.utils.BN(this.gasPrice), 'Gwei')),
                        // gasLimit: web3.utils.toHex(this.gasLimit),
                        to: this.tokens[0].contractAddress,
                        value: web3.utils.toHex(0),
                        data: data,
                        chainId: web3.utils.toHex(3)
                    }
                    this.signedTransaction = {
                        from: this.accountAddress,
                        nonce: web3.utils.toHex(count),
                        gasPrice: web3.utils.toHex(web3.utils.toWei(new web3.utils.BN(this.gasPrice), 'Gwei')),
                        // gasLimit: web3.utils.toHex(this.gasLimit),
                        to: this.tokens[0].contractAddress,
                        value: web3.utils.toHex(0),
                        data: data,
                        chainId: web3.utils.toHex(3)
                    }
                }
            },
            sendTransaction() {
                web3.eth.sendTransaction(this.signedTransaction).on('transactionHash', (hash) => {
                    alert('success, with hash ' + hash)
                    this.transferringToken.amount -= this.amount
                })
                this.rawTransaction = undefined
                this.signedTransaction = undefined
            },
            addToken() {
                this.tokens.push(this.token)
                this.transferrableTokens = [...this.tokens]
                this.transferrableTokens.push(this.transferringToken)
                localStorage.setItem('localTokens', JSON.stringify(this.tokens))
                let contract = new web3.eth.Contract(abi, this.token.contractAddress, {
                    from: this.accountAddress
                })
                contract.methods.balanceOf(this.accountAddress).call().then((result) => {
                        let tokenCount = result * 1.0 / (10 ** this.token.decimals)
                        this.$set(this.token, 'amount', tokenCount)
                        this.token = {}
                }).catch(console.error)
                this.addingToken = false
            },
            removeToken(token) {
                this.tokens = this.tokens.filter((t) => {
                    return t.contractAddress !== token.contractAddress
                })
                this.transferrableTokens = [...this.tokens]
                this.transferrableTokens.push(this.transferringToken)
                localStorage.setItem('localTokens', JSON.stringify(this.tokens))
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
                    let tokens = JSON.parse(localStorage.getItem('localTokens')) || []
                    tokens.forEach((token) => {
                        let contract = new web3.eth.Contract(abi, token.contractAddress, {
                            from: this.accountAddress
                        })
                        contract.methods.balanceOf(this.accountAddress).call().then((result) => {
                            let tokenCount = result * 1.0 / (10 ** token.decimals)
                            this.$set(token, 'amount', tokenCount)
                        }).catch(console.error)
                    })
                    this.tokens = [...tokens]
                    this.transferrableTokens = [...tokens]
                    this.transferringToken = {
                        symbol: 'ETH'
                    }
                    this.transferrableTokens.push(this.transferringToken)
                    // console.log(this.transferrableTokens)
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

    pre {
        white-space: pre-wrap;
    }

    input, select {
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
        float: left;
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
        float: right;
    }

    .add-token {
        display: inline-block;
        background-color: #fff;
        box-shadow: 16px 16px 47px 2px rgba(0, 0, 0, .07);
        padding: 1.5rem 2rem;
        min-height: 1.5rem;
        margin: 1rem auto;
        position: relative;
        width: calc(35% - 2rem);
        vertical-align: top;
        float: right;
    }

    .token {
        .delete-token {
            position: relative;
            top: 6px;
            margin-right: 5px;
            cursor: pointer;
        }
    }
</style>
