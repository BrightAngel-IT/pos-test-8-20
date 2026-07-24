/**
 * Module: Payments
 * 
 * React UI page component representing the Payments view.
 */

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { SectionHeading } from '../../components/SectionHeading'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPayments() {
      setLoading(true)
      try {
        const response = await axios.get('/api/payments')
        let data = response.data
        if (!Array.isArray(data)) data = []
        setPayments(data)
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
  }, [])

  return (
    <div>
      <SectionHeading title="Payments" />
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {payments.map((pay) => (
            <li key={pay._id}>Invoice: {pay.invoice?._id || pay.invoice}, Amount: {pay.amount}, Status: {pay.status}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
