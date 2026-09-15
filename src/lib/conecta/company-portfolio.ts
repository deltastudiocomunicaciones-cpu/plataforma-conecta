import assignments from "@/data/pymes-company-assignments.json";

export type AssignedCompany = {
  id: string;
  sourceNumber: number;
  name: string;
  referenceDays: number;
};
export type CompanyPortfolio = {
  source: string;
  sourceName: string;
  daysPeriod: string;
  companies: readonly AssignedCompany[];
};

export function getCompanyPortfolio(positionId: string): CompanyPortfolio | null {
  const portfolios: Record<string, CompanyPortfolio> = assignments;
  return Object.prototype.hasOwnProperty.call(portfolios, positionId) ? portfolios[positionId] : null;
}

export function getReferenceDays(portfolio: CompanyPortfolio) {
  return portfolio.companies.reduce((total, company) => total + company.referenceDays, 0);
}
