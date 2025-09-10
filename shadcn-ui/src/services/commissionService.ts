import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export interface CommissionRates {
  level1: number;
  level2: number;
  level3: number;
  lastUpdated: string;
}

export const commissionService = {
  // Get current commission rates for terms and conditions
  async getCurrentRates(): Promise<CommissionRates> {
    try {
      const response = await axios.get(`${API_BASE_URL}/commission/current-rates`);
      return response.data;
    } catch (error) {
      console.error('Error fetching commission rates:', error);
      // Return default rates if API fails
      return {
        level1: 15,
        level2: 5,
        level3: 2.5,
        lastUpdated: new Date().toISOString()
      };
    }
  }
};