import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import RecordForm from './components/RecordForm.jsx';

const api = axios.create({
  baseURL: '/api'
});

const App = () => {
  const [zones, setZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [dnsRecords, setDnsRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedZone = useMemo(
    () => zones.find((zone) => zone.id === selectedZoneId) ?? null,
    [zones, selectedZoneId]
  );

  const handleError = (message) => {
    setError(message || 'Unexpected error, please try again.');
  };


  const fetchZones = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/zones');

      setZones(response.data || []);
    } catch (err) {
      handleError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }

  const fetchDnsRecords = useCallback(async (zoneId) => {
    if (!zoneId) {
      setDnsRecords([]);
      return;
    }
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get(`/zones/${zoneId}/dns_records`);
      setDnsRecords(response.data);
    } catch (err) {
      handleError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
    
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  useEffect(() => {
    if (!zones.length) {
      setSelectedZoneId('');
      setDnsRecords([]);
      return;
    }

    const hasSelectedZone = zones.some((zone) => zone.id === selectedZoneId);
    if (!hasSelectedZone) {
      setSelectedZoneId(zones[0].id);
    }
  }, [zones, selectedZoneId]);

  useEffect(() => {
    if (!selectedZoneId) {
      setDnsRecords([]);
      return;
    }

    fetchDnsRecords(selectedZoneId);
  }, [selectedZoneId, fetchDnsRecords]);


  const handleZoneChange = (event) => {
    setSelectedZoneId(event.target.value);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveRecord(null);
  };

  const openCreateModal = () => {
    setActiveRecord(null);
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setActiveRecord(record);
    setIsModalOpen(true);
  };

  const handleDeleteRecord = async (record) => {
    const confirmed = window.confirm(`Delete ${record.type} record for ${record.name}?`);
    if (!confirmed || !selectedZoneId) return;

    try {
      setIsLoading(true);
      setError('');
      await api.delete(`/zones/${selectedZoneId}/dns_records/${record.id}`);
      await fetchDnsRecords(selectedZoneId);
    } catch (err) {
      handleError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRecord = async (values) => {
    if (!selectedZoneId) return;

    try {
      setIsSubmitting(true);
      setError('');
      if (activeRecord?.id) {
        await api.put(
          `/zones/${selectedZoneId}/dns_records/${activeRecord.id}`,
          values
        );
      } else {
        await api.post(`/zones/${selectedZoneId}/dns_records`, values);
      }
      closeModal();
      await fetchDnsRecords(selectedZoneId);
    } catch (err) {
      handleError(err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Cloudflare DNS Manager</h1>
            <p className="text-sm text-slate-500">
              管理您的 Cloudflare 域名解析记录，支持创建、修改和删除。
            </p>
          </div>
          <button
            onClick={fetchZones}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            刷新域名列表
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">选择域名</h2>
              <p className="text-sm text-slate-500">
                页面加载时会自动获取您的 Cloudflare Zone 列表。
              </p>
            </div>
            <select
              value={selectedZoneId}
              onChange={handleZoneChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 sm:w-72"
            >
              <option value="">请选择一个域名</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">DNS 解析记录</h2>
              {selectedZone ? (
                <p className="text-sm text-slate-500">当前域名：{selectedZone.name}</p>
              ) : (
                <p className="text-sm text-slate-500">请选择一个域名以查看解析记录。</p>
              )}
            </div>
            <button
              onClick={openCreateModal}
              disabled={!selectedZoneId}
              className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300"
            >
              添加新记录
            </button>
          </div>

          {isLoading && (
            <p className="py-4 text-sm text-slate-500">正在加载，请稍候...</p>
          )}

          {!isLoading && dnsRecords.length === 0 && selectedZoneId && (
            <p className="py-4 text-sm text-slate-500">当前域名暂时没有 DNS 解析记录。</p>
          )}

          {!isLoading && !selectedZoneId && (
            <p className="py-4 text-sm text-slate-500">请先选择一个域名。</p>
          )}

          {!isLoading && dnsRecords.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Content</th>
                    <th className="px-4 py-3">TTL</th>
                    <th className="px-4 py-3">Proxied</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {dnsRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs uppercase text-slate-600">{record.type}</td>
                      <td className="px-4 py-3 text-slate-700">{record.name}</td>
                      <td className="px-4 py-3 text-slate-700">{record.content}</td>
                      <td className="px-4 py-3 text-slate-700">{record.ttl === 1 ? 'Auto' : record.ttl}</td>
                      <td className="px-4 py-3 text-slate-700">{record.proxied ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(record)}
                            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            修改
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(record)}
                            className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                {activeRecord ? '修改解析记录' : '添加新的解析记录'}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 transition hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <RecordForm
              initialValues={activeRecord || undefined}
              onSubmit={handleSubmitRecord}
              onCancel={closeModal}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
