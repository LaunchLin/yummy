/** 与 app/actions/cook.createRecipe 入参一致，供表单组装 */

export type CreateRecipePayload = {
  name: string
  cover_url: string | null
  tags: string[]
  main_ingredients: { name: string; amount: string | null }[]
  aux_ingredients: string[]
  sauces: string[]
  prep: string | null
  steps: string | null
}

type IngredientRow = { value: string; quantity: string }

function rowsToAuxSauceStrings(rows: IngredientRow[]): string[] {
  return rows
    .filter((i) => i.value.trim())
    .map((i) => {
      const q = i.quantity.trim()
      return q ? `${i.value.trim()} · ${q}` : i.value.trim()
    })
}

export function buildCreateRecipePayload(args: {
  recipeName: string
  recipeImage: string | null
  selectedTags: string[]
  allTags: { id: string; label: string }[]
  mainIngredients: IngredientRow[]
  auxiliaryIngredients: IngredientRow[]
  sauceIngredients: IngredientRow[]
  prep: string
  steps: string
}): CreateRecipePayload {
  const tags = args.selectedTags
    .map((id) => args.allTags.find((t) => t.id === id)?.label)
    .filter((x): x is string => Boolean(x))

  const main_ingredients = args.mainIngredients
    .filter((i) => i.value.trim())
    .map((i) => ({
      name: i.value.trim(),
      amount: i.quantity.trim() || null,
    }))

  return {
    name: args.recipeName.trim(),
    cover_url: args.recipeImage,
    tags,
    main_ingredients,
    aux_ingredients: rowsToAuxSauceStrings(args.auxiliaryIngredients),
    sauces: rowsToAuxSauceStrings(args.sauceIngredients),
    prep: args.prep.trim() || null,
    steps: args.steps.trim() || null,
  }
}
