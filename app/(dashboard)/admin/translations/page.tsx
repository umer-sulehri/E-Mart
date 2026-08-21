'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchIcon } from '@/components/icons';
import en from '@/public/locales/en.json';
import ur from '@/public/locales/ur.json';

type TranslationEntry = { key: string; en: string; ur: string };

function flatten(obj: Record<string, unknown>, prefix = ''): TranslationEntry[] {
  const entries: TranslationEntry[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      entries.push(...flatten(v as Record<string, unknown>, fullKey));
    } else {
      entries.push({ key: fullKey, en: String((en as Record<string, string>)[fullKey] ?? ''), ur: String((ur as Record<string, string>)[fullKey] ?? '') });
    }
  }
  return entries;
}

function getGroup(key: string): string {
  const dot = key.indexOf('.');
  return dot === -1 ? key : key.slice(0, dot);
}

const inputStyle: React.CSSProperties = {
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
  borderRadius: '10px',
  height: '48px',
  padding: '0 12px',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

export default function AdminTranslationsPage() {
  const [search, setSearch] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftEn, setDraftEn] = useState('');
  const [draftUr, setDraftUr] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [translations, setTranslations] = useState<TranslationEntry[]>(() =>
    flatten(en as Record<string, unknown>)
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const markChanged = () => { setHasChanges(true); setSaved(false); };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const payload: Record<string, { en: string; ur: string }> = {};
      for (const t of translations) {
        payload[t.key] = { en: t.en, ur: t.ur };
      }
      await fetch('/api/v1/admin/translations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ translations: payload }),
      });
      setHasChanges(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return translations;
    const q = search.toLowerCase();
    return translations.filter(
      (t) =>
        t.key.toLowerCase().includes(q) ||
        t.en.toLowerCase().includes(q) ||
        t.ur.includes(q)
    );
  }, [translations, search]);

  const groups = useMemo(() => {
    const map = new Map<string, TranslationEntry[]>();
    for (const t of filtered) {
      const g = getGroup(t.key);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(t);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  const startEdit = (entry: TranslationEntry) => {
    setEditingKey(entry.key);
    setDraftEn(entry.en);
    setDraftUr(entry.ur);
  };

  const saveEdit = () => {
    if (!editingKey) return;
    setTranslations((prev) =>
      prev.map((t) =>
        t.key === editingKey ? { ...t, en: draftEn, ur: draftUr } : t
      )
    );
    markChanged();
    setEditingKey(null);
  };

  const cancelEdit = () => setEditingKey(null);

  return (
    <div style={{ padding: '32px', background: 'var(--color-bg)', minHeight: '100vh' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            Translations
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              margin: '4px 0 0',
            }}
          >
            Showing {filtered.length} of {translations.length} translations
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {saved && (
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-success)' }}>
              Saved!
            </span>
          )}
          <button
            onClick={handleSaveAll}
            disabled={saving || !hasChanges}
            style={{
              height: '44px',
              padding: '0 20px',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--color-primary)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: hasChanges && !saving ? 'pointer' : 'not-allowed',
              opacity: hasChanges && !saving ? 1 : 0.5,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '480px' }}>
        <SearchIcon
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '20px',
            height: '20px',
            color: 'var(--color-text-secondary)',
          }}
        />
        <input
          type="text"
          placeholder="Search by key, English value, or Urdu value..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            ...inputStyle,
            paddingLeft: '44px',
            paddingRight: '16px',
          }}
        />
      </div>

      {/* Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {groups.map(([group, entries]) => (
          <Card key={group} className="overflow-hidden">
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: 'var(--color-surface)',
                border: 'none',
                cursor: 'pointer',
                borderBottom: collapsedGroups.has(group) ? 'none' : '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    textTransform: 'capitalize',
                  }}
                >
                  {group}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                    background: 'var(--color-bg)',
                    padding: '2px 10px',
                    borderRadius: '20px',
                  }}
                >
                  {entries.length}
                </span>
              </div>
              <span
                style={{
                  fontSize: '18px',
                  color: 'var(--color-text-secondary)',
                  transition: 'transform 0.2s',
                  transform: collapsedGroups.has(group) ? 'rotate(-90deg)' : 'rotate(0)',
                  display: 'inline-block',
                }}
              >
                ▾
              </span>
            </button>

            {/* Table */}
            {!collapsedGroups.has(group) && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr
                      style={{
                        background: 'var(--color-primary-dark)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {['Key', 'English', 'Urdu', 'Actions'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => {
                      const isEditing = editingKey === entry.key;
                      return (
                        <tr
                          key={entry.key}
                          style={{ borderBottom: '1px solid var(--color-border)' }}
                        >
                          {/* Key */}
                          <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                            <code
                              style={{
                                background: 'var(--color-bg)',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                color: 'var(--color-text-primary)',
                                fontFamily: 'monospace',
                              }}
                            >
                              {entry.key}
                            </code>
                          </td>

                          {/* English */}
                          <td style={{ padding: '12px 16px', minWidth: '200px' }}>
                            {isEditing ? (
                              <input
                                value={draftEn}
                                onChange={(e) => setDraftEn(e.target.value)}
                                style={inputStyle}
                              />
                            ) : (
                              <span style={{ color: 'var(--color-text-primary)' }}>{entry.en}</span>
                            )}
                          </td>

                          {/* Urdu */}
                          <td style={{ padding: '12px 16px', minWidth: '200px' }}>
                            {isEditing ? (
                              <input
                                value={draftUr}
                                onChange={(e) => setDraftUr(e.target.value)}
                                dir="rtl"
                                style={inputStyle}
                              />
                            ) : (
                              <span dir="rtl" style={{ color: 'var(--color-text-primary)' }}>
                                {entry.ur}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {isEditing ? (
                                <>
                                  <Button
                                    onClick={saveEdit}
                                    style={{
                                      height: '40px',
                                      padding: '0 16px',
                                      borderRadius: '10px',
                                      border: 'none',
                                      background: 'var(--color-primary)',
                                      color: '#fff',
                                      fontSize: '13px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    onClick={cancelEdit}
                                    style={{
                                      height: '40px',
                                      padding: '0 16px',
                                      borderRadius: '10px',
                                      border: '1px solid var(--color-border)',
                                      background: 'var(--color-surface)',
                                      color: 'var(--color-text-primary)',
                                      fontSize: '13px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  onClick={() => startEdit(entry)}
                                  style={{
                                    height: '40px',
                                    padding: '0 16px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-text-secondary)',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                  }}
                                >
                                  Edit
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
