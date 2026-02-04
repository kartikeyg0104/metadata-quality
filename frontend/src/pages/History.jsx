import { useState, useEffect } from 'react';
import { getHistory, deleteEvaluation, getEvaluation } from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

export default function History() {
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    grade: '',
    minScore: '',
    maxScore: '',
    datasetName: ''
  });
  const [page, setPage] = useState(0);
  const limit = 20;

  // Modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    evaluationId: null,
    datasetName: '',
    loading: false
  });

  useEffect(() => {
    loadHistory();
  }, [page, filters]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = {
        limit,
        offset: page * limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        )
      };
      const data = await getHistory(params);
      setHistory(data.evaluations);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteEvaluation(id);
      setDeleteModal({ isOpen: false, evaluationId: null, datasetName: '', loading: false });
      loadHistory();
    } catch (err) {
      setError('Failed to delete: ' + err.message);
    }
  };

  const openDeleteModal = async (id) => {
    // Show modal with loading state
    setDeleteModal({
      isOpen: true,
      evaluationId: id,
      datasetName: '',
      loading: true
    });

    try {
      // Fetch fresh data from backend
      const evaluation = await getEvaluation(id);
      setDeleteModal({
        isOpen: true,
        evaluationId: id,
        datasetName: evaluation.dataset_name || 'Untitled Dataset',
        loading: false
      });
    } catch (err) {
      setDeleteModal({
        isOpen: true,
        evaluationId: id,
        datasetName: 'Unknown Dataset',
        loading: false
      });
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, evaluationId: null, datasetName: '', loading: false });
  };

  const getGradeClass = (grade) => {
    const classes = { A: 'excellent', B: 'good', C: 'acceptable', D: 'needs-work', F: 'poor' };
    return classes[grade] || '';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <main className="page-content">
      <div className="page-header">
        <h2>Evaluation History</h2>
        <span className="total-count">{pagination.total} evaluations</span>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search dataset name..."
          value={filters.datasetName}
          onChange={(e) => setFilters({ ...filters, datasetName: e.target.value })}
        />
        <select
          value={filters.grade}
          onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
        >
          <option value="">All Grades</option>
          <option value="A">Grade A</option>
          <option value="B">Grade B</option>
          <option value="C">Grade C</option>
          <option value="D">Grade D</option>
          <option value="F">Grade F</option>
        </select>
        <input
          type="number"
          placeholder="Min Score"
          value={filters.minScore}
          onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
          min="0"
          max="100"
        />
        <input
          type="number"
          placeholder="Max Score"
          value={filters.maxScore}
          onChange={(e) => setFilters({ ...filters, maxScore: e.target.value })}
          min="0"
          max="100"
        />
        <button 
          className="btn btn-secondary" 
          onClick={() => setFilters({ grade: '', minScore: '', maxScore: '', datasetName: '' })}
        >
          Clear
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <span>Loading history...</span>
        </div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📊</div>
          <h3>No Evaluations Yet</h3>
          <p>Save evaluations to see them here.</p>
        </div>
      ) : (
        <>
          <table className="data-table history-table">
            <thead>
              <tr>
                <th>Dataset</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td className="dataset-name">{item.dataset_name}</td>
                  <td className="score-cell">{item.overall_score}</td>
                  <td>
                    <span className={`grade-badge ${getGradeClass(item.grade?.grade)}`}>
                      {item.grade?.grade || 'N/A'}
                    </span>
                  </td>
                  <td className="date-cell">{formatDate(item.created_at)}</td>
                  <td className="actions-cell">
                    <button 
                      className="btn btn-small btn-danger"
                      onClick={() => openDeleteModal(item.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="btn btn-secondary"
            >
              Previous
            </button>
            <span>Page {page + 1} of {Math.ceil(pagination.total / limit)}</span>
            <button 
              disabled={!pagination.hasMore}
              onClick={() => setPage(p => p + 1)}
              className="btn btn-secondary"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={() => handleDelete(deleteModal.evaluationId)}
        title="Delete Evaluation"
        message={deleteModal.loading 
          ? "Loading evaluation details..." 
          : `Are you sure you want to delete "${deleteModal.datasetName}"? This action cannot be undone.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleteModal.loading}
      />
    </main>
  );
}
