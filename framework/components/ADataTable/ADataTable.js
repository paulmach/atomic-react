import PropTypes from "prop-types";
import React, {forwardRef, useMemo, useState} from "react";

import AIcon from "../AIcon";
import ASimpleTable from "../ASimpleTable";
import "./ADataTable.scss";

let rowId = 0;
const TableHeader = (props) => <th role='columnheader' className='a-data-table__header' {...props} />;
const TableRow = (props) => <tr role='row' className='a-data-table__row' {...props} />;
const TableCell = (props) => <td role='cell' className='a-data-table__cell' {...props} />;

const ADataTable = forwardRef(
  ({className: propsClassName, expandable, headers, items, onSort, sort, ...rest}, ref) => {
    const [expandedRows, setExpandedRows] = useState({});
    const ExpandableComponent = useMemo(() => expandable?.component, [expandable]);
    let className = 'a-data-table';
    if (ExpandableComponent) {
      className += ` a-data-table--expandable`;
    }
    if (propsClassName) {
      className += ` ${propsClassName}`;
    }

    let sortedItems = items;
    if (sort) {
      const sortDir = sort.direction === "desc" ? -1 : 1;
      const targetHeader = Object.values(headers).find(
        (x) => x.key === sort.key
      );

      let sortFunc = (a, b) => (a === b ? 0 : a < b ? -1 : 1);

      if (targetHeader && typeof targetHeader.sort === "function") {
        sortFunc = targetHeader.sort;
      }

      if (!targetHeader || targetHeader.sort !== false) {
        sortedItems.sort(
          (a, b) => sortDir * sortFunc(a[sort.key], b[sort.key])
        );
      }
    }

    return (
      headers &&
      items && (
        <ASimpleTable {...rest} ref={ref} className={className}>
          {headers && (
            <thead className='a-data-table__thead'>
              <TableRow>
                {ExpandableComponent && (
                  <TableHeader className='a-data-table__header a-data-table__header--hidden'>
                    <span className='a-data-table__header--hidden__text'>Toggle</span>
                  </TableHeader>
                )}
                {headers.map((x, i) => {
                  const headerProps = {
                    className: `a-data-table__header ${
                      x.sortable ? "a-data-table__header--sortable" : ""
                    } text-${x.align || "start"} ${x.className || ""}`
                      .replace("  ", " ")
                      .trim(),
                    role: "columnheader",
                    scope: "col",
                    "aria-label": x.name
                  };

                  if (x.sortable) {
                    if (!sort || x.key !== sort.key) {
                      headerProps["aria-label"] +=
                        ": Not sorted. Activate to sort ascending.";
                      headerProps["aria-sort"] = "none";
                    } else if (sort && sort.direction === "asc") {
                      headerProps["aria-label"] +=
                        ": Sorted ascending. Activate to sort descending.";
                      headerProps["aria-sort"] = "ascending";
                    } else {
                      headerProps["aria-label"] +=
                        ": Sorted descending. Activate to remove sorting.";
                      headerProps["aria-sort"] = "descending";
                    }

                    headerProps.onClick = () => {
                      setExpandedRows({});

                      onSort &&
                        onSort(
                          sort &&
                            sort.key === x.key &&
                            sort.direction === "desc"
                            ? null
                            : {
                                key: x.key,
                                direction:
                                  sort &&
                                  x.key === sort.key &&
                                  sort.direction === "asc"
                                    ? "desc"
                                    : "asc"
                              }
                        );
                    };
                  }

                  return (
                    <TableHeader {...headerProps} key={`a-data-table_header_${i}`}>
                      {x.align !== "end" && x.name}
                      {x.sortable && (
                        <AIcon
                          left={x.align === "end"}
                          right={x.align !== "end"}
                          className={`a-data-table__header__sort ${
                            sort && x.key === sort.key
                              ? "a-data-table__header__sort--active"
                              : ""
                          }`}>
                          {sort &&
                          x.key === sort.key &&
                          sort.direction === "desc"
                            ? "chevron-down"
                            : "chevron-up"}
                        </AIcon>
                      )}
                      {x.align === "end" && x.name}
                    </TableHeader>
                  );
                })}
                {ExpandableComponent && <TableHeader>Additional Details</TableHeader>}
              </TableRow>
            </thead>
          )}
          <tbody>
            {sortedItems.map((x, i) => {
              const id = `a-data-table_row_${i}`;
              const hasExpandedRowContent = ExpandableComponent &&
                (typeof expandable.isRowExpandable === 'function'
                  ? expandable.isRowExpandable(x)
                  : true
                );
              return (
                <TableRow data-expandable-row={hasExpandedRowContent} key={rowId++}>
                  {ExpandableComponent && (
                    <TableCell>
                      {hasExpandedRowContent && (
                        <button
                          aria-expanded={expandedRows[id] ? true : false}
                          aria-controls={id}
                          className='a-data-table__cell__btn--expand'
                          onClick={() => setExpandedRows(prev => ({...prev, [id]: !prev[id]}))}>
                          <AIcon size={12}>
                            {expandedRows[id] ? "chevron-down" : "chevron-right"}
                          </AIcon>
                        </button>
                      )}
                    </TableCell>
                  )}
                  {headers.map((y, j) => (
                    <TableCell
                      key={`a-data-table_cell_${j}`}
                      className={`a-data-table__cell text-${y.align || "start"} ${
                        y.cell?.className || ""
                      }`.trim()}
                      role='cell'>
                      {y.cell && y.cell.component
                        ? y.cell.component(x)
                        : x[y.key]}
                    </TableCell>
                  ))}
                  {hasExpandedRowContent && (
                    <TableCell
                      id={id}
                      data-expandable-content
                      hidden={!expandedRows[id]}
                      role='cell'>
                      <ExpandableComponent {...x} />
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </tbody>
        </ASimpleTable>
      )
    );
  }
);

ADataTable.propTypes = {
  /**
   * Toggles the `altLinks` display variant. If the table has many links, use this to display them in the base text color.
   */
  altLinks: PropTypes.bool,
  /**
   * Configuration object for expandable table rows
   */
  expandable: PropTypes.shape({
    /** The component to be rendered on expansion */
    component: PropTypes.func.isRequired,
    /**
     * (optional): A function called when rendering each row to determine
     * if the row can be expanded an collapsed
     */
    isRowExpandable: PropTypes.func,
  }),
  /**
   * Sets the table headers.
   */
  headers: PropTypes.arrayOf(
    PropTypes.shape({
      /** The text to be displayed in the header column */
      name: PropTypes.string,
      /** The unique identifier to associate a column with subsequent row data */
      key: PropTypes.string,
      /** CSS class used to style the header column */
      className: PropTypes.string,
      /** The alignment of the header column text content */
      align: PropTypes.oneOf(["start", "center", "end"]),
      /** Determines if the column can be sorted by the user */
      sortable: PropTypes.bool,
      /** Sorting function for the column data */
      sort: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
      /** Object that refers to the column's associated data table cells, i.e., <td /> elements */
      cell: PropTypes.shape({
        /** Class to be added to each table data element */
        className: PropTypes.string,
        /** Custom component to be rendered for each table data item */
        component: PropTypes.func
      })
    })
  ),
  /**
   * Sets the table data.
   */
  items: PropTypes.arrayOf(PropTypes.object),
  /**
   * Handles the `sort` event.
   */
  onSort: PropTypes.func,
  /**
   * Sets the sort.
   */
  sort: PropTypes.shape({
    key: PropTypes.string,
    direction: PropTypes.oneOf(["asc", "desc"])
  }),
  /**
   * Toggles the `striped` display variant. Darkened backgrounds for alternate rows.
   */
  striped: PropTypes.bool,
  /**
   * Toggles the `tight` display variant. Smaller row heights.
   */
  tight: PropTypes.bool
};

ADataTable.displayName = "ADataTable";

export default ADataTable;
