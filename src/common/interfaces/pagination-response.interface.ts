export interface PaginationMeta {
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface PaginationResponse<T> {
  items: T[];
  meta: PaginationMeta;
}