export interface AccountActivityRow {
  type: string;
  date: string;
  documentNumber: string;
  name: string;
  credit: number | undefined;
  debit: number | undefined;
  memo: string;
}
