import { gatepassRequests } from '../data/gatepassData'

export async function getGatepasses() {
  return Promise.resolve(gatepassRequests)
}