import { useEffect, useMemo, useRef } from 'react'
import { AllCommunityModule, ModuleRegistry, type ColDef } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { fmtUsd, matchesTab, statusInfo, type Tab } from '../lib/format'
import { useMedia } from '../lib/useNow'
import type { Bounty } from '../lib/types'
import type { GridContext } from './context'
import { ActionsCell, IssueCell, ScoreCell, StatusCell } from './renderers'
import { gridTheme } from './theme'

ModuleRegistry.registerModules([AllCommunityModule])

type Props = {
  rows: Bounty[]
  tab: Tab
  search: string
  context: GridContext
}

export function BountyGrid({ rows, tab, search, context }: Props) {
  const gridRef = useRef<AgGridReact<Bounty>>(null)
  const tabRef = useRef(tab)
  const wide = useMedia('(min-width: 900px)')

  // The status tabs are an external filter: the grid re-runs it whenever the tab changes.
  useEffect(() => {
    tabRef.current = tab
    gridRef.current?.api?.onFilterChanged()
  }, [tab])

  // Countdowns in the cells follow the page clock.
  useEffect(() => {
    gridRef.current?.api?.refreshCells({ force: true })
  }, [context.now, context.busyId])

  const columnDefs = useMemo<ColDef<Bounty>[]>(
    () => [
      {
        colId: 'issue',
        headerName: 'Issue',
        flex: 2,
        minWidth: 250,
        valueGetter: (p) => (p.data ? `${p.data.repo} #${p.data.issueNumber}` : ''),
        getQuickFilterText: (p) =>
          p.data ? `${p.data.repo} #${p.data.issueNumber} ${p.data.funderLogin} ${p.data.submissions.map((s) => s.authorLogin).join(' ')}` : '',
        cellRenderer: IssueCell,
      },
      {
        colId: 'amount',
        headerName: 'Amount',
        field: 'amountCents',
        width: 120,
        type: 'numericColumn',
        valueFormatter: (p) => fmtUsd(p.value as number),
        cellClass: 'amount',
      },
      {
        colId: 'status',
        headerName: 'Status',
        flex: 1.2,
        minWidth: 190,
        valueGetter: (p) => (p.data ? statusInfo(p.data, new Date()).label : ''),
        cellRenderer: StatusCell,
      },
      {
        colId: 'score',
        headerName: 'AI score',
        minWidth: 170,
        flex: 1,
        valueGetter: (p) => p.data?.review?.score ?? -1,
        getQuickFilterText: () => '',
        cellRenderer: ScoreCell,
      },
      {
        colId: 'actions',
        headerName: '',
        width: 290,
        sortable: false,
        resizable: false,
        pinned: wide ? 'right' : null,
        getQuickFilterText: () => '',
        cellRenderer: ActionsCell,
      },
    ],
    [wide],
  )

  return (
    <div className="grid-wrap">
      <AgGridReact<Bounty>
        ref={gridRef}
        theme={gridTheme}
        rowData={rows}
        columnDefs={columnDefs}
        defaultColDef={{ sortable: true, resizable: true }}
        getRowId={(p) => p.data.id}
        rowHeight={68}
        headerHeight={44}
        quickFilterText={search}
        isExternalFilterPresent={() => tabRef.current !== 'all'}
        doesExternalFilterPass={(node) => (node.data ? matchesTab(node.data, tabRef.current) : true)}
        context={context}
      />
    </div>
  )
}
