
 // 对搜索结果进行去重处理
 export const deduplicateSearchResults = (
     existingResults: any[],
     newResults: any[]
 ): any[] => {
   const uniqueResults = [...existingResults];
   const existingTexts = new Set(existingResults.map(item => item.text));

   for (const result of newResults) {
     if (!existingTexts.has(result.text)) {
       uniqueResults.push(result);
       existingTexts.add(result.text);
     }
   }

   return uniqueResults;
 };

 // 对图片进行去重处理
 export const deduplicateImages = (
     existingImages: string[],
     newImages: string[]
 ): string[] => {
   const uniqueImages = [...existingImages];
   const existingUrls = new Set(existingImages);

   for (const imageUrl of newImages) {
     if (!existingUrls.has(imageUrl)) {
       uniqueImages.push(imageUrl);
       existingUrls.add(imageUrl);
     }
   }

   return uniqueImages;
 };
