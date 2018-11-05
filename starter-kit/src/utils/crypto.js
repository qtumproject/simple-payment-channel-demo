export async function sign(web3, message, account) {
  let sig = await web3.eth.accounts.sign(message, account);

  return { r: sig.r, s: sig.s, v: sig.v }
}
