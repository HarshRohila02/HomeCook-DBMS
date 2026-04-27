import { shuttleSchedule } from '../data/shuttleData'

export async function getShuttleSchedule() {
  return Promise.resolve(shuttleSchedule)
}