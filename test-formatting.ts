// 일부러 포맷 안맞춘 파일
const messyCode = 'test'
function badFormat() {
  return {
    name: 'test',
    value: 123,
    status: true,
  }
}
const array = [1, 2, 3, 4, 5]
console.log(messyCode, badFormat(), array)
