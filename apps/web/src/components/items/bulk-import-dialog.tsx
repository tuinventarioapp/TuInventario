import * as Dialog from '@radix-ui/react-dialog'
import { CheckCircle2, CircleAlert, Download, FileSpreadsheet, Upload, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useI18n } from '../../i18n/use-i18n'
import { ApiError, api } from '../../lib/api'
import { cn, downloadBlob, downloadUrl } from '../../lib/utils'
import type { ItemImportCommitResponse, ItemImportPreviewResponse, ItemImportPreviewRow } from '../../types/api'
import { Notice } from '../shared/notice'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card } from '../ui/card'

type Stage = 'initial' | 'review' | 'result'

type BulkImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported?: () => void | Promise<void>
}

const TEMPLATE_FILENAME = 'plantilla-carga-masiva-articulos-v1.0.xlsx'
const TEMPLATE_FALLBACK_PATH = `/templates/${TEMPLATE_FILENAME}`

function metricTone(status: 'new' | 'match' | 'error') {
  if (status === 'new') return 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
  if (status === 'match') return 'border-sky-200 bg-sky-50/70 text-sky-950'
  return 'border-rose-200 bg-rose-50/80 text-rose-950'
}

function actionBadgeTone(row: ItemImportPreviewRow) {
  if (row.errors.length) return 'bg-rose-100 text-rose-900'
  if (row.canUpdate) return 'bg-amber-100 text-amber-900'
  return 'bg-emerald-100 text-emerald-900'
}

function resultBadgeTone(result: string) {
  if (result === 'CREATED') return 'bg-emerald-100 text-emerald-900'
  if (result === 'UPDATED') return 'bg-sky-100 text-sky-900'
  if (result === 'OMITTED') return 'bg-amber-100 text-amber-900'
  return 'bg-rose-100 text-rose-900'
}

export function BulkImportDialog({ open, onOpenChange, onImported }: BulkImportDialogProps) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [stage, setStage] = useState<Stage>('initial')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ItemImportPreviewResponse | null>(null)
  const [result, setResult] = useState<ItemImportCommitResponse | null>(null)
  const [selectedSkus, setSelectedSkus] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    if (!open) {
      setStage('initial')
      setFile(null)
      setPreview(null)
      setResult(null)
      setSelectedSkus([])
      setErrorMessage(null)
      setWarningMessage(null)
      setIsUploading(false)
      setIsApplying(false)
      setIsDownloadingTemplate(false)
      setDragActive(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [open])

  const matchRows = useMemo(
    () => preview?.rows.filter((row) => row.canUpdate) ?? [],
    [preview],
  )
  const errorRows = useMemo(
    () => preview?.rows.filter((row) => row.errors.length > 0) ?? [],
    [preview],
  )

  const handleApiError = (error: unknown) => {
    if (error instanceof ApiError) {
      setErrorMessage(error.message)
      return
    }
    setErrorMessage(t('bulkImport.genericError'))
  }

  const handleTemplateDownload = async () => {
    setIsDownloadingTemplate(true)
    setErrorMessage(null)
    setWarningMessage(null)
    try {
      const blob = await api.downloadItemImportTemplate()
      downloadBlob(blob, TEMPLATE_FILENAME)
    } catch (error) {
      downloadUrl(TEMPLATE_FALLBACK_PATH, TEMPLATE_FILENAME)
      setWarningMessage(t('bulkImport.downloadFallback'))
      if (error instanceof ApiError && error.status < 500) {
        setErrorMessage(error.message)
      }
    } finally {
      setIsDownloadingTemplate(false)
    }
  }

  const handleFile = async (nextFile: File | null) => {
    if (!nextFile) return
    setFile(nextFile)
    setErrorMessage(null)
    setPreview(null)
    setResult(null)
    setStage('initial')
    setIsUploading(true)

    try {
      const response = await api.previewItemImport(nextFile)
      setPreview(response)
      setSelectedSkus(response.rows.filter((row) => row.canUpdate).map((row) => row.sku))
      setStage('review')
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleCommit = async () => {
    if (!file) return
    setIsApplying(true)
    setErrorMessage(null)
    try {
      const response = await api.commitItemImport(file, selectedSkus)
      setResult(response)
      setStage('result')
      await onImported?.()
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsApplying(false)
    }
  }

  const toggleSku = (sku: string) => {
    setSelectedSkus((current) => current.includes(sku)
      ? current.filter((currentSku) => currentSku !== sku)
      : [...current, sku])
  }

  const selectAllMatches = () => {
    setSelectedSkus(matchRows.map((row) => row.sku))
  }

  const deselectAllMatches = () => {
    setSelectedSkus([])
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            'fixed z-50 flex max-h-[92vh] w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl',
            'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 sm:max-w-5xl',
            'max-sm:bottom-0 max-sm:left-3 max-sm:right-3 max-sm:top-auto max-sm:w-auto max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-[2rem]',
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7">
            <div className="space-y-1">
              <Dialog.Title className="text-xl font-semibold text-slate-950">
                {stage === 'initial' && t('bulkImport.title')}
                {stage === 'review' && t('bulkImport.reviewTitle')}
                {stage === 'result' && t('bulkImport.resultTitle')}
              </Dialog.Title>
              <Dialog.Description className="text-sm leading-6 text-slate-600">
                {stage === 'initial' && t('bulkImport.description')}
                {stage === 'review' && t('bulkImport.reviewDescription')}
                {stage === 'result' && t('bulkImport.resultDescription')}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button className="min-h-10 rounded-full bg-secondary px-3 text-secondary-foreground">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            {warningMessage ? <Notice variant="warning">{warningMessage}</Notice> : null}
            {errorMessage ? <Notice variant="error">{errorMessage}</Notice> : null}

            {stage === 'initial' ? (
              <div className="grid gap-4 lg:grid-cols-[1.08fr_1.08fr_0.94fr]">
                <Card className="flex h-full flex-col justify-between gap-5 border-slate-200">
                  <div className="space-y-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                      <Download className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-slate-950">{t('bulkImport.downloadTitle')}</h3>
                      <p className="text-sm leading-6 text-slate-600">{t('bulkImport.downloadDescription')}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                      {t('bulkImport.templateName')}
                    </div>
                  </div>
                  <Button className="w-full" disabled={isDownloadingTemplate} onClick={() => void handleTemplateDownload()}>
                    {isDownloadingTemplate ? t('bulkImport.downloading') : t('bulkImport.downloadAction')}
                  </Button>
                </Card>

                <Card className="flex h-full flex-col justify-between gap-5 border-slate-200">
                  <div className="space-y-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-slate-950">{t('bulkImport.uploadTitle')}</h3>
                      <p className="text-sm leading-6 text-slate-600">{t('bulkImport.uploadDescription')}</p>
                    </div>
                    <div
                      className={cn(
                        'rounded-[1.75rem] border border-dashed px-4 py-6 text-center transition',
                        dragActive ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-slate-50',
                      )}
                      onDragOver={(event) => {
                        event.preventDefault()
                        setDragActive(true)
                      }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={(event) => {
                        event.preventDefault()
                        setDragActive(false)
                        void handleFile(event.dataTransfer.files?.[0] ?? null)
                      }}
                    >
                      <p className="text-sm font-medium text-slate-900">{t('bulkImport.dropzoneTitle')}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{t('bulkImport.dropzoneDescription')}</p>
                      {file ? <p className="mt-3 text-xs font-medium text-slate-700">{file.name}</p> : null}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <input
                      ref={inputRef}
                      hidden
                      accept=".xlsx"
                      type="file"
                      onChange={(event) => {
                        void handleFile(event.target.files?.[0] ?? null)
                      }}
                    />
                    <Button className="w-full" onClick={() => inputRef.current?.click()} disabled={isUploading}>
                      {isUploading ? t('bulkImport.uploading') : t('bulkImport.uploadAction')}
                    </Button>
                    <p className="text-center text-xs text-slate-500">{t('bulkImport.fileSupport')}</p>
                  </div>
                </Card>

                <Card className="border-slate-200">
                  <div className="space-y-4">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-slate-950">{t('bulkImport.helpTitle')}</h3>
                      <p className="text-sm leading-6 text-slate-600">{t('bulkImport.helpDescription')}</p>
                    </div>
                    <ol className="space-y-3 text-sm leading-6 text-slate-600">
                      <li><strong className="text-slate-900">1.</strong> {t('bulkImport.helpStep1')}</li>
                      <li><strong className="text-slate-900">2.</strong> {t('bulkImport.helpStep2')}</li>
                      <li><strong className="text-slate-900">3.</strong> {t('bulkImport.helpStep3')}</li>
                      <li><strong className="text-slate-900">4.</strong> {t('bulkImport.helpStep4')}</li>
                    </ol>
                  </div>
                </Card>
              </div>
            ) : null}

            {stage === 'review' && preview ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{t('bulkImport.reviewEyebrow')}</p>
                    <p className="text-sm font-medium text-slate-900">{preview.fileName}</p>
                  </div>
                  <Badge className="bg-slate-900 text-white">{t('bulkImport.totalRows', { count: preview.summary.totalRows })}</Badge>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <Card className={metricTone('new')}>
                    <p className="text-3xl font-semibold">{preview.summary.newItems}</p>
                    <p className="mt-2 text-sm text-slate-600">{t('bulkImport.metricNew')}</p>
                  </Card>
                  <Card className={metricTone('match')}>
                    <p className="text-3xl font-semibold">{preview.summary.matches}</p>
                    <p className="mt-2 text-sm text-slate-600">{t('bulkImport.metricMatches')}</p>
                  </Card>
                  <Card className={metricTone('error')}>
                    <p className="text-3xl font-semibold">{preview.summary.errors}</p>
                    <p className="mt-2 text-sm text-slate-600">{t('bulkImport.metricErrors')}</p>
                  </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                  <Card className="border-slate-200 p-0">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">{t('bulkImport.matchTableTitle')}</h3>
                        <p className="text-sm text-slate-600">{t('bulkImport.matchTableDescription')}</p>
                      </div>
                      {matchRows.length ? (
                        <div className="flex flex-wrap gap-2">
                          <Button className="bg-secondary text-secondary-foreground" onClick={selectAllMatches}>{t('bulkImport.selectAll')}</Button>
                          <Button className="bg-secondary text-secondary-foreground" onClick={deselectAllMatches}>{t('bulkImport.clearSelection')}</Button>
                        </div>
                      ) : null}
                    </div>
                    {matchRows.length ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                              <th className="px-4 py-3">{t('bulkImport.tableUpdate')}</th>
                              <th className="px-4 py-3">SKU</th>
                              <th className="px-4 py-3">{t('bulkImport.tableExcelName')}</th>
                              <th className="px-4 py-3">{t('bulkImport.tableExisting')}</th>
                              <th className="px-4 py-3">{t('bulkImport.tableSuggestedAction')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-700">
                            {matchRows.map((row) => (
                              <tr key={`${row.rowNumber}-${row.sku}`}>
                                <td className="px-4 py-3">
                                  <input
                                    aria-label={`${t('bulkImport.tableUpdate')} ${row.sku}`}
                                    checked={selectedSkus.includes(row.sku)}
                                    type="checkbox"
                                    onChange={() => toggleSku(row.sku)}
                                  />
                                </td>
                                <td className="px-4 py-3 font-medium text-slate-950">{row.sku}</td>
                                <td className="px-4 py-3">{row.itemName}</td>
                                <td className="px-4 py-3">{row.existingItemName ?? t('common.notAvailable')}</td>
                                <td className="px-4 py-3">
                                  <Badge className={actionBadgeTone(row)}>{t(`bulkImport.action.${row.suggestedAction}`)}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="px-5 py-6">
                        <Notice>{t('bulkImport.noMatches')}</Notice>
                      </div>
                    )}
                  </Card>

                  <div className="space-y-4">
                    <Card className="border-slate-200">
                      <div className="flex items-start gap-3">
                        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-base font-semibold text-slate-950">{t('bulkImport.reviewRulesTitle')}</h3>
                          <p className="text-sm leading-6 text-slate-600">{t('bulkImport.reviewRulesDescription')}</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="border-slate-200">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
                            <CircleAlert className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-slate-950">{t('bulkImport.errorRowsTitle')}</h3>
                            <p className="text-sm text-slate-600">{t('bulkImport.errorRowsDescription')}</p>
                          </div>
                        </div>
                        {errorRows.length ? (
                          <div className="space-y-3">
                            {errorRows.map((row) => (
                              <div key={`error-${row.rowNumber}-${row.sku}`} className="rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3">
                                <p className="text-sm font-semibold text-rose-950">#{row.rowNumber} {row.sku || t('bulkImport.noSku')}</p>
                                <ul className="mt-2 space-y-1 text-xs leading-5 text-rose-900">
                                  {row.errors.map((error) => <li key={error}>- {error}</li>)}
                                </ul>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Notice>{t('bulkImport.noErrors')}</Notice>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button className="w-full bg-secondary text-secondary-foreground sm:w-auto" onClick={() => setStage('initial')}>
                    {t('bulkImport.backToStart')}
                  </Button>
                  <div className="grid gap-2 sm:flex">
                    <Button className="w-full bg-secondary text-secondary-foreground sm:w-auto" onClick={() => onOpenChange(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button className="w-full sm:w-auto" disabled={isApplying} onClick={() => void handleCommit()}>
                      {isApplying ? t('bulkImport.applying') : t('bulkImport.applyImport')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {stage === 'result' && result ? (
              <div className="space-y-6">
                <div className="grid gap-3 md:grid-cols-4">
                  <Card className="border-emerald-200 bg-emerald-50/70">
                    <p className="text-3xl font-semibold text-emerald-950">{result.summary.created}</p>
                    <p className="mt-2 text-sm text-emerald-900">{t('bulkImport.summaryCreated')}</p>
                  </Card>
                  <Card className="border-sky-200 bg-sky-50/70">
                    <p className="text-3xl font-semibold text-sky-950">{result.summary.updated}</p>
                    <p className="mt-2 text-sm text-sky-900">{t('bulkImport.summaryUpdated')}</p>
                  </Card>
                  <Card className="border-amber-200 bg-amber-50/80">
                    <p className="text-3xl font-semibold text-amber-950">{result.summary.omitted}</p>
                    <p className="mt-2 text-sm text-amber-900">{t('bulkImport.summaryOmitted')}</p>
                  </Card>
                  <Card className="border-rose-200 bg-rose-50/80">
                    <p className="text-3xl font-semibold text-rose-950">{result.summary.errors}</p>
                    <p className="mt-2 text-sm text-rose-900">{t('bulkImport.summaryErrors')}</p>
                  </Card>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-emerald-100 text-emerald-900">{t('bulkImport.resultBadgeCreated', { count: result.summary.created })}</Badge>
                  <Badge className="bg-sky-100 text-sky-900">{t('bulkImport.resultBadgeUpdated', { count: result.summary.updated })}</Badge>
                  <Badge className="bg-amber-100 text-amber-900">{t('bulkImport.resultBadgeOmitted', { count: result.summary.omitted })}</Badge>
                  <Badge className="bg-rose-100 text-rose-900">{t('bulkImport.resultBadgeErrors', { count: result.summary.errors })}</Badge>
                </div>

                <Card className="border-slate-200 p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3">#</th>
                          <th className="px-4 py-3">SKU</th>
                          <th className="px-4 py-3">{t('common.name')}</th>
                          <th className="px-4 py-3">{t('common.status')}</th>
                          <th className="px-4 py-3">{t('bulkImport.resultMessages')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-700">
                        {result.rows.map((row) => (
                          <tr key={`${row.rowNumber}-${row.sku}-${row.outcome}`}>
                            <td className="px-4 py-3">{row.rowNumber}</td>
                            <td className="px-4 py-3 font-medium text-slate-950">{row.sku}</td>
                            <td className="px-4 py-3">{row.itemName}</td>
                            <td className="px-4 py-3">
                              <Badge className={resultBadgeTone(row.outcome)}>{t(`bulkImport.result.${row.outcome}`)}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <ul className="space-y-1 text-xs leading-5 text-slate-500">
                                {row.messages.map((message) => <li key={message}>- {message}</li>)}
                              </ul>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={() => onOpenChange(false)}>{t('bulkImport.closeResult')}</Button>
                </div>
              </div>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
