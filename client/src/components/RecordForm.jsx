import { useEffect, useState } from 'react';

const DEFAULT_RECORD = {
  type: 'A',
  name: '',
  content: '',
  ttl: 3600,
  proxied: false
};

const SUPPORTED_TYPES = ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'SRV', 'CAA'];

const normalizeInitialValues = (values = {}) => ({
  ...DEFAULT_RECORD,
  ...values,
  ttl: values?.ttl === 1 ? 1 : Number(values?.ttl || DEFAULT_RECORD.ttl),
  proxied: Boolean(values?.proxied)
});

const RecordForm = ({ initialValues, onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState(normalizeInitialValues(initialValues));

  useEffect(() => {
    setFormData(normalizeInitialValues(initialValues));
  }, [initialValues]);

  const handleChange = (field) => (event) => {
    const value =
      field === 'proxied'
        ? event.target.checked
        : field === 'ttl'
        ? Number(event.target.value)
        : event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Type
          <select
            value={formData.type}
            onChange={handleChange('type')}
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            required
          >
            {SUPPORTED_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm font-medium text-slate-700">
          Name
          <input
            type="text"
            value={formData.name}
            onChange={handleChange('name')}
            placeholder="subdomain"
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            required
          />
        </label>

        <label className="flex flex-col text-sm font-medium text-slate-700">
          Content
          <input
            type="text"
            value={formData.content}
            onChange={handleChange('content')}
            placeholder="IPv4/IPv6 address or other value"
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            required
          />
        </label>

        <label className="flex flex-col text-sm font-medium text-slate-700">
          TTL (seconds)
          <input
            type="number"
            min="1"
            value={formData.ttl}
            onChange={handleChange('ttl')}
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            required
          />
        </label>
      </div>

      <div className="flex items-center justify-between rounded-md bg-slate-100 px-4 py-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={formData.proxied}
            onChange={handleChange('proxied')}
            className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
          />
          Proxied through Cloudflare
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300"
        >
          {isSubmitting ? 'Saving...' : 'Save record'}
        </button>
      </div>
    </form>
  );
};

export default RecordForm;
