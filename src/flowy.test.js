/* global describe, it, expect */

const flowy = require('..')

describe('flowy', () => {
  it('should have unit-tests', () => {
    expect(1 + 1).toBe(2)
  })

  it('should be importable', () => {
    expect(flowy).toBeDefined()
  })
})
