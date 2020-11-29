import knex from "knexClient"
import getAvailabilities from "./getAvailabilities"

describe("getAvailabilities", () => {
  beforeEach(() => knex("events").truncate())

  describe("No Events", () => {
    it("Next 7 days availabilty", async () => {
      const availabilities = await getAvailabilities(new Date("2014-08-10"))
      expect(availabilities.length).toBe(7)
      for (let i = 0; i < 7; ++i) {
        expect(availabilities[i].slots).toEqual([])
      }
    })
    it("Next 30 days availability", async () => {
      const availabilities = await getAvailabilities(new Date("2014-08-10"), 30)
      expect(availabilities.length).toBe(30)
      for (let i = 0; i < 30; ++i) {
        expect(availabilities[i].slots).toEqual([])
      }
    })
    it("Next 200 days availability", async () => {
      const availabilities = await getAvailabilities(
        new Date("2014-08-10"),
        200
      )
      expect(availabilities.length).toBe(200)
      for (let i = 0; i < 200; ++i) {
        expect(availabilities[i].slots).toEqual([])
      }
    })
    it("Next 366 days availability", async () => {
      const availabilities = await getAvailabilities(
        new Date("2014-08-10"),
        366
      )
      expect(availabilities.length).toBe(366)
      for (let i = 0; i < 366; ++i) {
        expect(availabilities[i].slots).toEqual([])
      }
    })
  })

  describe("With 1 Event for Both", () => {
    beforeEach(async () => {
      await knex("events").insert([
        {
          kind: "appointment",
          starts_at: new Date("2014-08-11 10:30"),
          ends_at: new Date("2014-08-11 11:30"),
        },
        {
          kind: "opening",
          starts_at: new Date("2014-08-04 09:30"),
          ends_at: new Date("2014-08-04 12:30"),
          weekly_recurring: true,
        },
      ])
    })

    it("test 1", async () => {
      const availabilities = await getAvailabilities(new Date("2014-08-10"))

      expect(availabilities.length).toBe(7)

      expect(String(availabilities[0].date)).toBe(
        String(new Date("2014-08-10"))
      )
      expect(availabilities[0].slots).toEqual([])

      expect(String(availabilities[1].date)).toBe(
        String(new Date("2014-08-11"))
      )
      expect(availabilities[1].slots).toEqual([
        "9:30",
        "10:00",
        "11:30",
        "12:00",
      ])

      expect(String(availabilities[6].date)).toBe(
        String(new Date("2014-08-16"))
      )
    })
    it("test 2", async () => {
      const availabilities = await getAvailabilities(new Date("2014-08-16"))
      expect(String(availabilities[0].date)).toBe(
        String(new Date("2014-08-16"))
      )
      expect(availabilities[0].slots).toEqual([])
      expect(String(availabilities[2].date)).toBe(
        String(new Date("2014-08-18"))
      )
      expect(availabilities[2].slots).toEqual([
        "9:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "12:00",
      ])
    })
  })

  describe("With Opening event in Future", () => {
    beforeEach(async () => {
      await knex("events").insert([
        {
          kind: "appointment",
          starts_at: new Date("2014-08-11 10:30"),
          ends_at: new Date("2014-08-11 11:30"),
        },
        {
          kind: "opening",
          starts_at: new Date("2018-08-04 09:30"),
          ends_at: new Date("2018-08-04 12:30"),
          weekly_recurring: true,
        },
      ])
    })

    it("test 1", async () => {
      const availabilities = await getAvailabilities(new Date("2014-08-10"))
      expect(availabilities.length).toBe(7)

      expect(String(availabilities[0].date)).toBe(
        String(new Date("2014-08-10"))
      )
      expect(availabilities[0].slots).toEqual([])

      expect(String(availabilities[6].date)).toBe(
        String(new Date("2014-08-16"))
      )
      expect(availabilities[6].slots).toEqual([])
    })
  })
  describe("With 1 event for both and numberOfDays is greater than 7", () => {
    beforeEach(async () => {
      await knex("events").insert([
        {
          kind: "appointment",
          starts_at: new Date("2019-09-22 10:30"),
          ends_at: new Date("2019-09-22 11:30"),
        },
        {
          kind: "opening",
          starts_at: new Date("2019-09-04 09:30"),
          ends_at: new Date("2019-09-04 12:30"),
          weekly_recurring: true,
        },
      ])
    })

    it("test 1", async () => {
      const availabilities = await getAvailabilities(new Date("2019-09-21"), 10)
      expect(availabilities.length).toBe(10)

      expect(String(availabilities[0].date)).toBe(
        String(new Date("2019-09-21"))
      )
      expect(availabilities[0].slots).toEqual([])

      expect(String(availabilities[1].date)).toBe(
        String(new Date("2019-09-22"))
      )

      expect(String(availabilities[4].date)).toBe(
        String(new Date("2019-09-25"))
      )

      expect(availabilities[4].slots).toEqual([
        "9:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "12:00",
      ])
      expect(String(availabilities[9].date)).toBe(
        String(new Date("2019-09-30"))
      )
    })
  })
  describe("Mixed Events", () => {
    beforeEach(async () => {
      await knex("events").insert([
        {
          kind: "appointment",
          starts_at: new Date("2019-09-29 10:30"),
          ends_at: new Date("2019-09-29 11:30"),
        },
        {
          kind: "opening",
          starts_at: new Date("2019-09-15 09:30"),
          ends_at: new Date("2019-09-15 12:30"),
          weekly_recurring: true,
        },
        {
          kind: "appointment",
          starts_at: new Date("2019-10-07 10:30"),
          ends_at: new Date("2019-10-07 11:30"),
        },
        {
          kind: "opening",
          starts_at: new Date("2019-10-07 09:30"),
          ends_at: new Date("2019-10-07 12:30"),
          weekly_recurring: false,
        },
      ])
    })

    it("check availability for more than 7 days", async () => {
      const availabilities = await getAvailabilities(new Date("2019-09-21"), 17)

      expect(availabilities.length).toBe(17)

      expect(String(availabilities[0].date)).toBe(
        String(new Date("2019-09-21"))
      )

      expect(availabilities[0].slots).toEqual([])

      expect(availabilities[1].slots).toEqual([
        "9:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "12:00",
      ])

      expect(availabilities[8].slots).toEqual([
        "9:30",
        "10:00",
        "11:30",
        "12:00",
      ])
    })

    it("check availability non recurring and recurring openings", async () => {
      const availabilities = await getAvailabilities(new Date("2019-09-21"), 17)

      expect(String(availabilities[16].date)).toBe(
        String(new Date("2019-10-07"))
      )

      // it is non recurring with appointment
      expect(availabilities[16].slots).toEqual([
        "9:30",
        "10:00",
        "11:30",
        "12:00",
      ])
    })
  })
  describe("Opening events on more than one day", () => {
    beforeEach(async () => {
      await knex("events").insert([
        {
          kind: "appointment",
          starts_at: new Date("2014-08-11 10:30"),
          ends_at: new Date("2014-08-11 11:30"),
        },
        {
          kind: "opening",
          starts_at: new Date("2014-08-04 09:30"),
          ends_at: new Date("2014-08-04 12:30"),
          weekly_recurring: true,
        },
        {
          kind: "appointment",
          starts_at: new Date("2014-08-18 10:30"),
          ends_at: new Date("2014-08-18 11:30"),
        },
        {
          kind: "opening",
          starts_at: new Date("2014-08-20 09:30"),
          ends_at: new Date("2014-08-20 12:30"),
          weekly_recurring: true,
        },
        {
          kind: "appointment",
          starts_at: new Date("2014-08-20 10:30"),
          ends_at: new Date("2014-08-20 11:30"),
        },
        {
          kind: "appointment",
          starts_at: new Date("2014-08-20 9:30"),
          ends_at: new Date("2014-08-20 10:30"),
        },
      ])
    })

    it("test 1", async () => {
      const availabilities = await getAvailabilities(new Date("2014-08-15"))
      expect(availabilities.length).toBe(7)

      expect(String(availabilities[0].date)).toBe(
        String(new Date("2014-08-15"))
      )
      expect(availabilities[0].slots).toEqual([])

      expect(String(availabilities[1].date)).toBe(
        String(new Date("2014-08-16"))
      )
      expect(availabilities[1].slots).toEqual([])

      expect(String(availabilities[3].date)).toBe(
        String(new Date("2014-08-18"))
      )
      expect(availabilities[3].slots).toEqual([
        "9:30",
        "10:00",
        "11:30",
        "12:00",
      ])
      expect(String(availabilities[4].date)).toBe(
        String(new Date("2014-08-19"))
      )
      expect(availabilities[4].slots).toEqual([])
      expect(String(availabilities[5].date)).toBe(
        String(new Date("2014-08-20"))
      )
      expect(availabilities[5].slots).toEqual(["11:30", "12:00"])
    })

    it("test 2", async () => {
      const availabilities = await getAvailabilities(new Date("2014-08-04"), 20)
      expect(availabilities.length).toBe(20)

      expect(String(availabilities[0].date)).toBe(
        String(new Date("2014-08-04"))
      )
      expect(availabilities[0].slots).toEqual([
        "9:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "12:00",
      ])

      expect(String(availabilities[1].date)).toBe(
        String(new Date("2014-08-05"))
      )
      expect(availabilities[1].slots).toEqual([])

      expect(String(availabilities[3].date)).toBe(
        String(new Date("2014-08-07"))
      )
      expect(availabilities[3].slots).toEqual([])
      expect(String(availabilities[10].date)).toBe(
        String(new Date("2014-08-14"))
      )
      expect(availabilities[11].slots).toEqual([])
      expect(String(availabilities[5].date)).toBe(
        String(new Date("2014-08-09"))
      )
      expect(availabilities[5].slots).toEqual([])
      expect(String(availabilities[8].date)).toBe(
        String(new Date("2014-08-12"))
      )
      expect(String(availabilities[14].date)).toBe(
        String(new Date("2014-08-18"))
      )
      expect(availabilities[14].slots).toEqual([
        "9:30",
        "10:00",
        "11:30",
        "12:00",
      ])
      expect(String(availabilities[16].date)).toBe(
        String(new Date("2014-08-20"))
      )
      expect(availabilities[16].slots).toEqual(["11:30", "12:00"])
    })
  })
  describe("Two openings on same day", () => {
    beforeEach(async () => {
      await knex("events").insert([
        {
          kind: "opening",
          starts_at: new Date("2014-08-04 09:30"),
          ends_at: new Date("2014-08-04 12:30"),
          weekly_recurring: true,
        },
        {
          kind: "opening",
          starts_at: new Date("2014-08-04 14:30"),
          ends_at: new Date("2014-08-04 16:30"),
          weekly_recurring: true,
        },
        {
          kind: "appointment",
          starts_at: new Date("2014-08-11 10:30"),
          ends_at: new Date("2014-08-11 11:30"),
        },
      ])
    })

    it("test1", async () => {
      const availabilities = await getAvailabilities(new Date("2014-08-10"))

      expect(availabilities[1].slots).toEqual([
        "9:30",
        "10:00",
        "11:30",
        "12:00",
        "14:30",
        "15:00",
        "15:30",
        "16:00",
      ])
    })
  })
  describe("Recurring appointment and opening at the same day", () => {
    beforeEach(async () => {
      await knex("events").insert([
        {
          kind: "opening",
          starts_at: new Date("2014-08-04 09:30"),
          ends_at: new Date("2014-08-04 12:30"),
          weekly_recurring: true,
        },
        {
          kind: "opening",
          starts_at: new Date("2014-08-04 14:30"),
          ends_at: new Date("2014-08-04 16:30"),
          weekly_recurring: true,
        },
        {
          kind: "appointment",
          starts_at: new Date("2014-08-04 10:30"),
          ends_at: new Date("2014-08-04 11:30"),
          weekly_recurring: true,
        },
      ])
    })

    it("test1", async () => {
      const availabilities = await getAvailabilities(new Date("2014-08-10"))

      expect(availabilities[1].slots).toEqual([
        "9:30",
        "10:00",
        "11:30",
        "12:00",
        "14:30",
        "15:00",
        "15:30",
        "16:00",
      ])
    })
  })
  describe("Recurring openings but after given week", () => {
    beforeEach(async () => {
      await knex("events").insert([
        {
          kind: "opening",
          starts_at: new Date("2014-08-25 09:30"),
          ends_at: new Date("2014-08-25 12:30"),
          weekly_recurring: true,
        },
        {
          kind: "opening",
          starts_at: new Date("2014-08-25 14:30"),
          ends_at: new Date("2014-08-25 16:30"),
          weekly_recurring: true,
        },
        {
          kind: "appointment",
          starts_at: new Date("2014-08-04 10:30"),
          ends_at: new Date("2014-08-04 11:30"),
          weekly_recurring: true,
        },
      ])
    })

    it("should handle recurring after week ends", async () => {
      const availabilities = await getAvailabilities(new Date("2014-08-10"))

      expect(availabilities[1].slots).toEqual([])
    })
  })
  describe("No openings", () => {
    beforeEach(async () => {
      await knex("events").insert([
        {
          kind: "appointment",
          starts_at: new Date("2014-08-04 10:30"),
          ends_at: new Date("2014-08-04 11:30"),
          weekly_recurring: true,
        },
      ])
    })

    it("should handle no openings", async () => {
      const availabilities = await getAvailabilities(new Date("2014-08-10"))

      expect(availabilities[1].slots).toEqual([])
    })
  })
  describe("No appointments", () => {
    beforeEach(async () => {
      await knex("events").insert([
        {
          kind: "opening",
          starts_at: new Date("2014-08-04 09:30"),
          ends_at: new Date("2014-08-04 12:30"),
          weekly_recurring: true,
        },
        {
          kind: "opening",
          starts_at: new Date("2014-08-04 14:30"),
          ends_at: new Date("2014-08-04 16:30"),
          weekly_recurring: true,
        },
        {
          kind: "appointment",
          starts_at: new Date("2014-08-25 14:30"),
          ends_at: new Date("2014-08-25 16:30"),
          weekly_recurring: true,
        },
      ])
    })

    it("should handle no appointments", async () => {
      const availabilities = await getAvailabilities(new Date("2014-08-10"))

      expect(availabilities[1].slots).toEqual([
        "9:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "12:00",
        "14:30",
        "15:00",
        "15:30",
        "16:00",
      ])
    })
  })
  describe("Recurring appointments", () => {
    beforeEach(async () => {
      await knex("events").insert([
        {
          kind: "opening",
          starts_at: new Date("2014-08-04 09:30"),
          ends_at: new Date("2014-08-04 12:30"),
          weekly_recurring: true,
        },
        {
          kind: "opening",
          starts_at: new Date("2014-08-04 14:30"),
          ends_at: new Date("2014-08-04 16:30"),
          weekly_recurring: true,
        },
        {
          kind: "appointment",
          starts_at: new Date("2014-08-11 9:30"),
          ends_at: new Date("2014-08-11 10:30"),
          weekly_recurring: true,
        },
        {
          kind: "appointment",
          starts_at: new Date("2014-08-04 10:30"),
          ends_at: new Date("2014-08-04 11:30"),
          weekly_recurring: true,
        },
      ])
    })

    it("should handle recurring appointments", async () => {
      const availabilities = await getAvailabilities(new Date("2014-08-10"))

      expect(availabilities[1].slots).toEqual([
        "11:30",
        "12:00",
        "14:30",
        "15:00",
        "15:30",
        "16:00",
      ])
    })
  })
  describe("Mixed events with no recurring flag in opening event", () => {
    beforeEach(async () => {
      await knex("events").insert([
        {
          kind: "appointment",
          starts_at: new Date("2014-08-11 10:30"),
          ends_at: new Date("2014-08-11 11:30"),
        },
        {
          kind: "opening",
          starts_at: new Date("2014-08-04 09:30"),
          ends_at: new Date("2014-08-04 12:30"),
          weekly_recurring: true,
        },
        {
          kind: "opening",
          starts_at: new Date("2014-08-12 13:00"),
          ends_at: new Date("2014-08-12 18:00"),
        },
        {
          kind: "opening",
          starts_at: new Date("2014-08-12 8:00"),
          ends_at: new Date("2014-08-12 11:00"),
        },
        {
          kind: "appointment",
          starts_at: new Date("2014-08-12 9:30"),
          ends_at: new Date("2014-08-12 15:30"),
        },
      ])
    })

    it("test1", async () => {
      const availabilities = await getAvailabilities(new Date("2014-08-10"))
      expect(availabilities.length).toBe(7)

      expect(String(availabilities[0].date)).toBe(
        String(new Date("2014-08-10"))
      )
      expect(availabilities[0].slots).toEqual([])

      expect(String(availabilities[1].date)).toBe(
        String(new Date("2014-08-11"))
      )
      expect(availabilities[1].slots).toEqual([
        "9:30",
        "10:00",
        "11:30",
        "12:00",
      ])

      expect(availabilities[2].slots).toEqual([
        "8:00",
        "8:30",
        "9:00",
        "15:30",
        "16:00",
        "16:30",
        "17:00",
        "17:30",
      ])

      expect(String(availabilities[6].date)).toBe(
        String(new Date("2014-08-16"))
      )
    })
  })
})
