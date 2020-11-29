import moment from "moment"
import knex from "knexClient"

/**
 *
 * @param {*} availabilitiesKeys
 * @param {*} eventDate
 * @param {*} weekly_recurring
 * @return matched date keys for a given day on recurring events
 */

const matchKeysWithEvent = (
  availabilitiesKeys,
  eventDate,
  weekly_recurring
) => {
  let matchedDateKeys = [] //holds date keys
  availabilitiesKeys.forEach((dateKey) => {
    if (
      weekly_recurring &&
      eventDate.format("d") === moment(new Date(dateKey)).format("d") &&
      dateKey >= eventDate.format("YYYY-MM-DD")
    ) {
      matchedDateKeys.push(dateKey)
    } else if (
      !weekly_recurring &&
      eventDate.format("YYYY-MM-DD") === dateKey
    ) {
      matchedDateKeys.push(dateKey)
    }
  })

  return matchedDateKeys
}

/**
 *
 * @param {*} date
 * @return fetch the events from the given date.
 */
const getEvents = (date) =>
  knex
    .select("kind", "starts_at", "ends_at", "weekly_recurring")
    .from("events")
    .orderBy("kind", "desc")
    .orderBy("starts_at", "asc")
    .where(function () {
      this.where("weekly_recurring", true).orWhere("ends_at", ">", +date)
    })

/**
 *
 * @param {*} date
 * @param {*} numberOfDays
 * @return initialize schema with empty slots for any given days
 */

const initializeAvailabilitesSchema = (date, numberOfDays) => {
  const availabilities = new Map()
  for (let i = 0; i < numberOfDays; ++i) {
    const tmpDate = moment(date).add(i, "days")
    availabilities.set(tmpDate.format("YYYY-MM-DD"), {
      date: tmpDate.toDate(),
      slots: [],
    })
  }

  return availabilities
}

/**
 *
 * @param {*} matchedKeys
 * @param {*} availabilities
 * @param {*} eventDate
 * fill slots for given date on opening event
 */
const fillSlots = (matchedKeys, availabilities, eventDate) => {
  matchedKeys.forEach((dateKey) => {
    const day = availabilities.get(dateKey)
    if (day.slots.indexOf(eventDate.format("H:mm")) < 0) {
      day.slots.push(eventDate.format("H:mm"))
    }
  })
}

/**
 *
 * @param {*} matchedKeys
 * @param {*} availabilities
 * @param {*} eventDate
 * filter slots for given date on appointment event
 */
const filterSlots = (matchedKeys, availabilities, eventDate) => {
  matchedKeys.forEach((dateKey) => {
    const day = availabilities.get(dateKey)
    day.slots = day.slots.filter(
      (slot) => slot.indexOf(eventDate.format("H:mm")) === -1
    )
  })
}

/**
 *
 * @param {*} date
 * @param {*} numberOfDays (optional)
 * returns availability for any given days
 */

export default async function getAvailabilities(date, numberOfDays = 7) {
  const availabilities = initializeAvailabilitesSchema(date, numberOfDays) //holds empty slots for given date and days

  const events = await getEvents(date)

  const availabilitiesKeys = Array.from(availabilities.keys()) //holds dates keys for availabilities

  for (const event of events) {
    for (
      let eventDate = moment(event.starts_at);
      eventDate.isBefore(event.ends_at);
      eventDate.add(30, "minutes")
    ) {
      const matchedKeys = matchKeysWithEvent(
        availabilitiesKeys,
        eventDate,
        event.weekly_recurring
      )

      switch (event.kind) {
        case "opening":
          fillSlots(matchedKeys, availabilities, eventDate)
          break
        case "appointment":
          filterSlots(matchedKeys, availabilities, eventDate)
          break
      }
    }
  }

  return Array.from(availabilities.values())
}
