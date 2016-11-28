import * as React from 'react'
import { DiffLine, DiffLineType } from '../../models/diff'
import { selectedLineClass } from './selection/selection'
import { assertNever } from '../../lib/fatal-error'
import * as classNames from 'classnames'

/** The props for the diff gutter. */
interface IDiffGutterProps {
  /** The line being represented by the gutter. */
  readonly line: DiffLine

  /**
   * In the case of a non-readonly line, indicates whether the given line
   * should be rendered as selected or not.
   */
  readonly isIncluded: boolean

  /**
   * The line number of the diff within the rendered diff
   */
  readonly index: number

  /**
   * Indicate whether the diff needs to handle user interactions
   */
  readonly readOnly: boolean

  /**
   * Callback to signal when the mouse enters the rendered area
   */
  readonly onMouseEnter: (index: number, isHunkSelection: boolean) => void

  /**
   * Callback to signal when the mouse leaves the rendered area
   */
  readonly onMouseLeave: (index: number, isHunkSelection: boolean) => void

  /**
   * Callback to signal when the mouse button is pressed on this element
   */
  readonly onMouseDown: (index: number, isHunkSelection: boolean) => void

  /**
   * Callback to signal when the mouse is hovering over this element
   */
  readonly onMouseMove: (index: number, isHunkSelection: boolean) => void

  /**
   * Callback to signal when the mouse button is released on this element
   */
  readonly onMouseUp: (index: number) => void
}

function isIncludeable(type: DiffLineType): boolean {
  return type === DiffLineType.Add || type === DiffLineType.Delete
}

// TODO: this doesn't consider mouse events outside the right edge

function isMouseInHunkSelectionZone(ev: MouseEvent): boolean {
  // MouseEvent is not generic, but getBoundingClientRect should be
  // available for all HTML elements
  // docs: https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect

  const element: any = ev.currentTarget
  const offset: ClientRect = element.getBoundingClientRect()
  const relativeLeft = ev.clientX - offset.left

  const edge = offset.width - 10

  return relativeLeft >= edge
}

/** The gutter for a diff's line. */
export class DiffLineGutter extends React.Component<IDiffGutterProps, void> {

  private elem_: HTMLSpanElement | undefined

  private isIncluded(): boolean {
    return isIncludeable(this.props.line.type) && this.props.isIncluded
  }

  private getLineClassName(): string {
    const type = this.props.line.type
    switch (type) {
      case DiffLineType.Add: return 'diff-add'
      case DiffLineType.Delete: return 'diff-delete'
      case DiffLineType.Context: return 'diff-context'
      case DiffLineType.Hunk: return 'diff-hunk'
    }

    return assertNever(type, `Unknown DiffLineType ${type}`)
  }

  private getLineClass(): string {
    const lineClass = this.getLineClassName()
    const selectedClass = this.isIncluded() ? selectedLineClass : null

    return classNames('diff-line-gutter', lineClass, selectedClass)
  }

  private mouseEnterHandler = (ev: MouseEvent) => {
    ev.preventDefault()

    const isHunkSelection = isMouseInHunkSelectionZone(ev)
    this.props.onMouseEnter(this.props.index, isHunkSelection)
  }

  private mouseLeaveHandler = (ev: MouseEvent) => {
    ev.preventDefault()

    const isHunkSelection = isMouseInHunkSelectionZone(ev)
    this.props.onMouseLeave(this.props.index, isHunkSelection)
  }

  private mouseMoveHandler = (ev: MouseEvent) => {
    ev.preventDefault()

    const isHunkSelection = isMouseInHunkSelectionZone(ev)
    this.props.onMouseMove(this.props.index, isHunkSelection)
  }

  private mouseUpHandler = (ev: UIEvent) => {
    ev.preventDefault()

    this.props.onMouseUp(this.props.index)
  }

  private mouseDownHandler = (ev: MouseEvent) => {
    ev.preventDefault()

    const isHunkSelection = isMouseInHunkSelectionZone(ev)
    this.props.onMouseDown(this.props.index, isHunkSelection)
  }

  private renderEventHandlers = (elem: HTMLSpanElement) => {
    // read-only diffs do not support any interactivity
    if (this.props.readOnly) {
      return
    }

    // ignore anything from diff context rows
    if (!isIncludeable(this.props.line.type)) {
      return
    }

    this.elem_ = elem

    elem.addEventListener('mouseenter', this.mouseEnterHandler)
    elem.addEventListener('mouseleave', this.mouseLeaveHandler)
    elem.addEventListener('mousemove', this.mouseMoveHandler)
    elem.addEventListener('mousedown', this.mouseDownHandler)
    elem.addEventListener('mouseup', this.mouseUpHandler)
  }

  public cleanup() {
    // read-only diffs do not support any interactivity
    if (this.props.readOnly) {
      return
    }

    // ignore anything from diff context rows
    if (!isIncludeable(this.props.line.type)) {
      return
    }

    if (this.elem_) {
      this.elem_.removeEventListener('mouseenter', this.mouseEnterHandler)
      this.elem_.removeEventListener('mouseleave', this.mouseLeaveHandler)
      this.elem_.removeEventListener('mousemove', this.mouseMoveHandler)
      this.elem_.removeEventListener('mousedown', this.mouseDownHandler)
      this.elem_.removeEventListener('mouseup', this.mouseUpHandler)
    }
  }

  public render() {
    return (
      <span className={this.getLineClass()}
            ref={this.renderEventHandlers}>
        <span className='diff-line-number before'>{this.props.line.oldLineNumber || ' '}</span>
        <span className='diff-line-number after'>{this.props.line.newLineNumber || ' '}</span>
      </span>
    )
  }
}
