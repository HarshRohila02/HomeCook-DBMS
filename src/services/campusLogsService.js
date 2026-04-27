import { campusLogs } from '../data/campusLogsData'

export async function getCampusLogs() {
  return Promise.resolve(campusLogs)
}