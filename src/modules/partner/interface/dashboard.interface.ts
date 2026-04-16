// ─── Use-Case Port ────────────────────────────────────────────────────────────

export interface IPartnerDashboardUseCase {
  getDashboardStats(partnerId: string): Promise<any>;
  getTopMovies(partnerId: string, limit?: number): Promise<any>;
  getOccupancyStats(partnerId: string, startDate?: Date, endDate?: Date): Promise<any>;
}
