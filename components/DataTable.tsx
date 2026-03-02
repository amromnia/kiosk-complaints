'use client';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  // Pagination
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  // Actions
  actions?: (item: T) => React.ReactNode;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  loading = false,
  emptyMessage = 'لا توجد بيانات',
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 20,
  onPageChange,
  actions,
}: DataTableProps<T>) {
  const handleRowClick = (item: T) => {
    if (onRowClick) onRowClick(item);
  };

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner spinner-dark spinner-lg"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="empty-state">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              {actions && <th>الإجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={item.id || index}
                onClick={() => handleRowClick(item)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(item) : item[col.key]}
                  </td>
                ))}
                {actions && (
                  <td onClick={(e) => e.stopPropagation()}>
                    {actions(item)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '20px',
            padding: '16px',
            background: 'var(--color-bg-secondary)',
            borderRadius: '8px',
          }}
        >
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            عرض {startItem} - {endItem} من {totalItems}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.875rem' }}
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              السابق
            </button>

            <div style={{ display: 'flex', gap: '4px' }}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                if (pageNumber < 1 || pageNumber > totalPages) return null;

                return (
                  <button
                    key={pageNumber}
                    className={`btn ${pageNumber === currentPage ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 12px', fontSize: '0.875rem', minWidth: '36px' }}
                    onClick={() => onPageChange(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.875rem' }}
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              التالي
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
