import { sleep } from './time'

export async function getTransactionReceipt(qweb3, txid) {
  let receipt = []
  while (receipt.length === 0) {
    await sleep(1000)
    receipt = await qweb3.getTransactionReceipt(txid)
  }

  return receipt
}
