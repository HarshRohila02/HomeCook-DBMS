import {
  dashboardHighlights,
  heroData,
  messTabs,
  quickModules,
  todaysMenu,
} from '../data/dashboardData'

export async function getDashboardData() {
  return Promise.resolve({
    heroData,
    quickModules,
    messTabs,
    todaysMenu,
    dashboardHighlights,
  })
}