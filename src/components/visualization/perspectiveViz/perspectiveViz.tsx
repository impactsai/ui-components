import './perspectiveViz.css'
import '@finos/perspective-viewer'
import '@finos/perspective-viewer-datagrid'
import '@finos/perspective-viewer-d3fc'
import '@finos/perspective-viewer/dist/css/pro.css'
import '@finos/perspective-viewer/dist/css/pro-dark.css'

import perspective, { type ViewConfig } from '@finos/perspective'
import type { HTMLPerspectiveViewerElement } from '@finos/perspective-viewer'
import type { Theme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Stack from '@mui/system/Stack'
import useTheme from '@mui/system/useTheme'
import React, { useEffect, useRef, useState } from 'react'

import type {
  TableConfig,
  TableData,
  TableFilter,
  TableHeader,
  TableSort,
} from '../../types'

function createHeaderMap(headers?: Array<TableHeader>): Record<string, string> {
  if (!headers) {
    return {}
  }

  return headers.reduce(
    (map, header) => {
      const { dataKey, label } = header
      map[dataKey] = label || dataKey
      return map
    },
    {} as Record<string, string>
  )
}

export function transformTableData(
  originalData: Array<Record<string, string | number>>,
  headers?: TableHeader[]
) {
  const headerMap = createHeaderMap(headers)
  return originalData.map((record) => {
    const newData: Record<string, Array<string | number>> = {}
    for (const [key, value] of Object.entries(record)) {
      const newKey = headerMap[key] || key
      newData[newKey] = [value]
    }
    return newData
  })
}

/**
The PerspectiveViz component is designed to efficiently display and process large datasets, supporting interactive features such as filtering, sorting, and aggregating data for enhanced analysis and visualization. It integrates with the [Perspective library](https://perspective.finos.org/) to render data in various formats, including datagrids(pivot tables) and charts.

Note: [Perspective](https://perspective.finos.org/) is not bundled, so it must be included in the application's build process.
 */
function PerspectiveViz(props: TableData) {
  if (props.data.length === 0) {
    return <Typography variant="body2">No data available.</Typography>
  }

  const viewerRef = useRef<HTMLPerspectiveViewerElement | null>(null)
  const rusticTheme: Theme = useTheme()
  const [hasError, setHasError] = useState<boolean>(false)
  const perspectiveTheme =
    rusticTheme.palette.mode === 'dark' ? 'Pro Dark' : 'Pro Light'

  const headerMap = createHeaderMap(props.headers)

  function formatFilterConfig(filter: Array<TableFilter>): Array<TableFilter> {
    return filter.map((filterItem) => {
      const filterColumn = headerMap[filterItem[0]] || filterItem[0]
      const filterOperation = filterItem[1]

      const filterValue = filterItem[filterItem.length - 1]
      return [filterColumn, filterOperation, filterValue]
    })
  }

  function transformTableConfig(config: TableConfig): ViewConfig {
    const { groupBy, splitBy, aggregates, sort, filter, columns } = config

    const formattedSortConfig = sort?.map((sortItem) => {
      const sortColumn = headerMap[sortItem[0]] || sortItem[0]
      const sortDirection = sortItem[1]
      return [sortColumn, sortDirection] as TableSort
    })

    const formattedAggregates =
      aggregates &&
      Object.fromEntries(
        Object.entries(aggregates).map(([dataKey, aggregateOption]) => [
          headerMap[dataKey] || dataKey,
          aggregateOption,
        ])
      )

    const transformedConfig = {
      group_by: groupBy?.map((dataKey) => headerMap[dataKey] || dataKey),
      split_by: splitBy?.map((dataKey) => headerMap[dataKey] || dataKey),
      aggregates: formattedAggregates,
      sort: formattedSortConfig,
      filter: filter && formatFilterConfig(filter),
      columns: columns?.map((dataKey) => headerMap[dataKey] || dataKey),
    }

    return transformedConfig
  }

  const transformedConfig = props.config && transformTableConfig(props.config)

  useEffect(() => {
    const worker = perspective.worker()
    worker
      .table(transformTableData(props.data, props.headers))
      .then((table) => {
        const viewer = viewerRef.current
        if (viewer) {
          viewer
            .load(table)
            .then(() => {
              viewer.restore({
                ...transformedConfig,
                theme: perspectiveTheme,
                title: props.title,
                settings: false,
              })
              if (viewer.shadowRoot) {
                const sheet = new CSSStyleSheet()
                sheet.replaceSync(
                  '#settings_panel { background: none}' +
                    '#plugin_selector_container.open { overflow: scroll!important;}' +
                    '#debug_open_button.sidebar_close_button { display: none; }'
                )
                viewer.shadowRoot.adoptedStyleSheets.push(sheet)
              }
            })
            .catch(() => {
              setHasError(true)
            })
        }
      })
      .catch(() => {
        setHasError(true)
      })
  }, [props.data, perspectiveTheme])

  if (hasError) {
    return (
      <Typography variant="body2">Failed to create table from data.</Typography>
    )
  } else {
    return (
      <Stack direction="column" className="rustic-perspective-viz">
        {props.title && (
          <Typography variant="h6" data-cy="table-title">
            {props.title}
          </Typography>
        )}
        {props.description && (
          <Typography variant="body1" data-cy="table-description">
            {props.description}
          </Typography>
        )}
        <perspective-viewer
          ref={viewerRef}
          style={{
            fontFamily: rusticTheme.typography.fontFamily,
          }}
        ></perspective-viewer>
      </Stack>
    )
  }
}

export default PerspectiveViz
