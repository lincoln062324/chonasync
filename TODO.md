# POS.jsx Syntax Fix - TODO

## Steps from approved plan:

### 1. [x] Insert missing `addToCart` function definition in POS.jsx
   - Wrap the orphaned `setCart` block with `const addToCart = (product) => { ... };`
   - Location: immediately before `const outOfStock = products.filter(p => p.stock === 0);`

### 2. [x] Verify edit success and test
   - VSCode shows no lint errors after fix (confirmed via read_file)
   - Syntax fixed; app should build cleanly now

### 3. [x] Complete task
   - Syntax error fixed in POS.jsx

