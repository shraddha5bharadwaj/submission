import Downshift from "downshift"
import { useCallback, useRef, useState } from "react"
import ReactDOM from "react-dom"
import classNames from "classnames"
import { DropdownPosition, GetDropdownPositionFn, InputSelectOnChange, InputSelectProps } from "./types"

export function InputSelect<TItem>({
  label,
  defaultValue,
  onChange: consumerOnChange,
  items,
  parseItem,
  isLoading,
  loadingLabel,
}: InputSelectProps<TItem>) {
  const [selectedValue, setSelectedValue] = useState<TItem | null>(defaultValue ?? null)
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null)
  const selectRef = useRef<HTMLDivElement>(null)

  const onChange = useCallback<InputSelectOnChange<TItem>>(
    (selectedItem) => {
      if (selectedItem === null) {
        return
      }

      consumerOnChange(selectedItem)
      setSelectedValue(selectedItem)
    },
    [consumerOnChange]
  )

  return (
    <Downshift<TItem>
      id="RampSelect"
      onChange={onChange}
      selectedItem={selectedValue}
      itemToString={(item) => (item ? parseItem(item).label : "")}
    >
      {({
        getItemProps,
        getLabelProps,
        getMenuProps,
        isOpen,
        highlightedIndex,
        selectedItem,
        getToggleButtonProps,
        inputValue,
      }) => {
        const toggleProps = getToggleButtonProps()
        const parsedSelectedItem = selectedItem === null ? null : parseItem(selectedItem)

        return (
          <div className="RampInputSelect--root" ref={selectRef}>
            <label className="RampText--s RampText--hushed" {...getLabelProps()}>
              {label}
            </label>
            <div className="RampBreak--xs" />
            <div
              className="RampInputSelect--input"
              onClick={(event) => {
                setDropdownPosition(getDropdownPosition(event.target))
                toggleProps.onClick(event)
              }}
            >
              {inputValue}
            </div>

            {isOpen &&
              dropdownPosition &&
              ReactDOM.createPortal(
                <div
                  className={classNames("RampInputSelect--dropdown-container", {
                    "RampInputSelect--dropdown-container-opened": isOpen,
                  })}
                  {...getMenuProps()}
                  style={{
                    position: "absolute",
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                    zIndex: 1000,
                    background: "white",
                    border: "1px solid #ddd",
                    padding: "10px",
                    boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
                    // width: selectRef.current?.offsetWidth || "auto", // Ensure dropdown matches input width
                  }}
                >
                  {renderItems()}
                </div>,
                document.body // Render dropdown outside of scrolling containers
              )}
          </div>
        )

        function renderItems() {
          if (!isOpen) return null
          if (isLoading) return <div className="RampInputSelect--dropdown-item">{loadingLabel}...</div>
          if (items.length === 0) return <div className="RampInputSelect--dropdown-item">No items</div>

          return items.map((item, index) => {
            const parsedItem = parseItem(item)
            return (
              <div
                key={parsedItem.value}
                {...getItemProps({
                  key: parsedItem.value,
                  index,
                  item,
                  className: classNames("RampInputSelect--dropdown-item", {
                    "RampInputSelect--dropdown-item-highlighted": highlightedIndex === index,
                    "RampInputSelect--dropdown-item-selected":
                      parsedSelectedItem?.value === parsedItem.value,
                  }),
                })}
              >
                {parsedItem.label}
              </div>
            )
          })
        }
      }}
    </Downshift>
  )
}

// Ensure dropdown stays in place even when scrolling
const getDropdownPosition: GetDropdownPositionFn = (target) => {
  if (target instanceof Element) {
    const { top, left, height } = target.getBoundingClientRect()
    const { scrollY, scrollX } = window
    return {
      top: scrollY + top + height, // Position right below input
      left: scrollX + left, // Align left with input field
    }
  }

  return { top: 0, left: 0 }
}
