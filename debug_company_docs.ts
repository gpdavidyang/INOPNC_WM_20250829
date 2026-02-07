import { fetchCompanyDocs } from './app/documents/hub/actions'

async function check() {
  try {
    const docs = await fetchCompanyDocs()
    console.log('COMPANY DOCS:', JSON.stringify(docs, null, 2))
  } catch (err) {
    console.error('ERROR:', err)
  }
}

check()
