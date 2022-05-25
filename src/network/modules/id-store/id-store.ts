import cbor from "cbor"
import { Message } from "../../../message"
import type { NetworkModule } from "../types"

export type GetPhraseReturnType = ReturnType<typeof getPhrase>

export type GetCredentialDataReturnType = ReturnType<typeof getCredentialData>

interface IdStore extends NetworkModule {
  store: (
    address: string,
    credId: ArrayBuffer,
    credCosePublicKey: ArrayBuffer,
  ) => Promise<GetPhraseReturnType>
  getFromRecallPhrase: (phrase: string) => Promise<GetCredentialDataReturnType>
  getFromAddress: (address: string) => Promise<GetCredentialDataReturnType>
}

export const IdStore: IdStore = {
  _namespace_: "idStore",

  async store(
    address: string,
    credId: ArrayBuffer,
    credCosePublicKey: ArrayBuffer,
  ): Promise<GetPhraseReturnType> {
    const m = new Map()
    m.set(0, address)
    m.set(1, Buffer.from(credId))
    m.set(2, credCosePublicKey)
    const message = await this.call("idstore.store", m)
    return getPhrase(message)
  },

  async getFromRecallPhrase(
    phrase: string,
  ): Promise<GetCredentialDataReturnType> {
    const val = phrase.trim().split(" ")
    const message = await this.call(
      "idstore.getFromRecallPhrase",
      new Map([[0, val]]),
    )
    return getCredentialData(message)
  },

  async getFromAddress(address: string): Promise<GetCredentialDataReturnType> {
    const message = await this.call(
      "idstore.getFromAddress",
      new Map([[0, address]]),
    )
    return getCredentialData(message)
  },
}

function getPhrase(m: Message): { phrase: string } {
  const result = { phrase: "" }
  const payload = m.getPayload()
  if (payload) {
    result.phrase = payload?.get(0)?.join(" ")
  }
  return result
}

function getCredentialData(m: Message): {
  credentialId?: ArrayBuffer
  cosePublicKey?: ArrayBuffer
} {
  const result = { credentialId: undefined, cosePublicKey: undefined }
  const payload = m.getPayload()
  if (payload) {
    if (payload.has(0) && payload.has(1)) {
      result.credentialId = payload.get(0)
      result.cosePublicKey = payload.get(1)
    }
  }
  return result
}
