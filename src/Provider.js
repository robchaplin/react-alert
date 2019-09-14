import React, { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { TransitionGroup } from 'react-transition-group'
import DefaultContext from './Context'
import Wrapper from './Wrapper'
import Transition from './Transition'
import { positions, transitions, types } from './options'
import { groupBy } from './helpers'

const Provider = ({
  children,
  offset,
  position,
  timeout,
  type,
  transition,
  containerStyle,
  template: AlertComponent,
  context: Context,
  ...props
}) => {
  const timersId = useRef([])
  const [alerts, setAlerts] = useState([])

  const remove = alert => {
    setAlerts(prevState => {
      const lengthBeforeRemove = prevState.length
      const alerts = prevState.filter(a => a.id !== alert.id)

      if (lengthBeforeRemove > alerts.length && alert.options.onClose) {
        alert.options.onClose()
      }

      return alerts
    })
  }

  const show = (message = '', options = {}) => {
    const id = Math.random()
      .toString(36)
      .substr(2, 9)

    const alertOptions = {
      position: options.position || position,
      timeout,
      type,
      ...options
    }

    const alert = {
      id,
      message,
      options: alertOptions
    }

    alert.close = () => remove(alert)

    if (alert.options.timeout) {
      const timerId = setTimeout(() => {
        remove(alert)

        timersId.current.splice(timersId.current.indexOf(timerId), 1)
      }, alert.options.timeout)

      timersId.current.push(timerId)
    }

    setAlerts(alerts => alerts.concat(alert))
    if (alert.options.onOpen) alert.options.onOpen()

    return alert
  }

  const success = (message = '', options = {}) => {
    options.type = types.SUCCESS
    return show(message, options)
  }

  const error = (message = '', options = {}) => {
    options.type = types.ERROR
    return show(message, options)
  }

  const info = (message = '', options = {}) => {
    options.type = types.INFO
    return show(message, options)
  }

  const alertContext = {
    alerts,
    show,
    remove,
    success,
    error,
    info
  }

  const alertsByPosition = groupBy(alerts, alert => alert.options.position)

  return (
    <Context.Provider value={alertContext}>
      {children}
      <>
        {Object.values(positions).map(position => (
          <TransitionGroup
            appear
            key={position}
            options={{ position, containerStyle }}
            component={Wrapper}
            {...props}
          >
            {alertsByPosition[position]
              ? alertsByPosition[position].map(alert => (
                  <Transition type={transition} key={alert.id}>
                    <AlertComponent style={{ margin: offset }} {...alert} />
                  </Transition>
                ))
              : null}
          </TransitionGroup>
        ))}
      </>
    </Context.Provider>
  )
}

Provider.propTypes = {
  offset: PropTypes.string,
  position: PropTypes.oneOf(Object.values(positions)),
  timeout: PropTypes.number,
  type: PropTypes.oneOf(Object.values(types)),
  transition: PropTypes.oneOf(Object.values(transitions)),
  containerStyle: PropTypes.object,
  template: PropTypes.oneOfType([PropTypes.element, PropTypes.func]).isRequired,
  context: PropTypes.shape({
    Provider: PropTypes.object,
    Consumer: PropTypes.object
  })
}

Provider.defaultProps = {
  offset: '10px',
  position: positions.TOP_CENTER,
  timeout: 0,
  type: types.INFO,
  transition: transitions.FADE,
  containerStyle: {
    zIndex: 100
  },
  context: DefaultContext
}

export default Provider
