import { MockNutritionApi, getNutritionApi } from '../../tools/nutritionApi';

describe('Nutrition API', () => {
  describe('MockNutritionApi', () => {
    let api: MockNutritionApi;

    beforeEach(() => {
      api = new MockNutritionApi();
    });

    describe('getFoodNutritionData', () => {
      test('should return nutrition data for known foods', async () => {
        const apple = await api.getFoodNutritionData('apple');
        expect(apple).toEqual({
          name: 'Apple',
          calories: 95,
          protein: 0.5,
          carbs: 25,
          fat: 0.3,
          fiber: 4.5,
          sugar: 19,
        });

        const chickenBreast = await api.getFoodNutritionData('chicken breast');
        expect(chickenBreast).toEqual({
          name: 'Chicken Breast',
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
        });
      });

      test('should be case insensitive when matching foods', async () => {
        const apple = await api.getFoodNutritionData('APPLE');
        expect(apple.name).toBe('Apple');
        expect(apple.calories).toBe(95);

        const chickenBreast = await api.getFoodNutritionData('Chicken Breast');
        expect(chickenBreast.name).toBe('Chicken Breast');
        expect(chickenBreast.calories).toBe(165);
      });

      test('should match partial food names', async () => {
        const apple = await api.getFoodNutritionData('fresh apple');
        expect(apple.name).toBe('Apple');

        const chicken = await api.getFoodNutritionData('grilled chicken breast with herbs');
        expect(chicken.name).toBe('Chicken Breast');
      });

      test('should generate placeholder data for unknown foods', async () => {
        const unknownFood = await api.getFoodNutritionData('exotic fruit');

        expect(unknownFood.name).toBe('exotic fruit');
        expect(typeof unknownFood.calories).toBe('number');
        expect(typeof unknownFood.protein).toBe('number');
        expect(typeof unknownFood.carbs).toBe('number');
        expect(typeof unknownFood.fat).toBe('number');
      });
    });

    describe('searchFoods', () => {
      test('should return matching foods from the database', async () => {
        const results = await api.searchFoods('rice');
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].name).toBe('Brown Rice');
      });

      test('should respect the limit parameter', async () => {
        const results = await api.searchFoods('', 2); // Should return first 2 foods
        expect(results.length).toBe(2);
      });

      test('should return generated placeholder when no matches found', async () => {
        const results = await api.searchFoods('xyz123');
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('xyz123');
        // Verify other properties exist
        expect(typeof results[0].calories).toBe('number');
      });
    });
  });

  describe('getNutritionApi', () => {
    test('should return an instance of MockNutritionApi', () => {
      const api = getNutritionApi();
      expect(api).toBeInstanceOf(MockNutritionApi);
    });
  });
});
