const proxyUrl = "https://cors-anywhere.herokuapp.com/";

const majesticWineUrlTemplates = ["https://www.majestic.co.uk/wine?pageSize=[PAGESIZE]&pageNum=[PAGENO]"];
const laithwaitesUrlTemplates = ["https://www.laithwaites.co.uk/wines?No=[WINENO]#page-[PAGENO]"];
const waitroseUrlTemplates = ["https://www.waitrosecellar.com/webapp/wcs/stores/servlet/CategoryNavigationResultsView?pageSize=[PAGESIZE]&manufacturer=&searchType=&resultCatEntryType=&catalogId=10551&categoryId=1043025&langId=-1&storeId=10701&sType=SimpleSearch&filterFacet=&metaData=aXNDb3Jwb3JhdGVXaW5lOiJOIg%3D%3D&beginIndex=[BEGININDEX]&contentBeginIndex=0&facet=&resultType=products&orderBy=&viewAll=false&maxPrice=&minPrice=&facetSnapshot=&identifier=1595064975949"];
const virginWinesUrlTemplates = ["https://www.virginwines.co.uk/browse?page=[PAGENO]"];
const slurpUrlTemplates = ["https://www.slurp.co.uk/wine?p=[PAGENO]"];
const honestGrapesUrlTemplates = ["https://www.honestgrapes.co.uk/wines/all-wines?p=[PAGENO]"];
const bbrUrlTemplates = [
   "https://www.bbr.com/offer/red-wines?q=:bbr-relevance:inStockFlag:true:color:Red:approvalStatus:APPROVED&sort=bbr-relevance&sort=bbr-relevance&page=[PAGENO]&pageSize=[PAGESIZE]",
   "https://www.bbr.com/offer/white-wines?q=:bbr-relevance:inStockFlag:true:color:White:approvalStatus:APPROVED&sort=bbr-relevance&sort=bbr-relevance&page=[PAGENO]&pageSize=[PAGESIZE]",
   "https://www.bbr.com/category-rose?q=:bbr-relevance:inStockFlag:true:approvalStatus:APPROVED&sort=bbr-relevance&sort=bbr-relevance&page=[PAGENO]&pageSize=[PAGESIZE]",
   "https://www.bbr.com/region-539-champagne?q=:bbr-relevance:inStockFlag:true:approvalStatus:APPROVED&sort=bbr-relevance&sort=bbr-relevance&page=[PAGENO]&pageSize=[PAGESIZE]",
   "https://www.bbr.com/category-sparkling-wine?q=:bbr-relevance:inStockFlag:true:approvalStatus:APPROVED&sort=bbr-relevance&sort=bbr-relevance&page=[PAGENO]&pageSize=[PAGESIZE]",
   "https://www.bbr.com/region-615-port-wine?q=:bbr-relevance:inStockFlag:true:approvalStatus:APPROVED&sort=bbr-relevance&sort=bbr-relevance&page=[PAGENO]&pageSize=[PAGESIZE]"
]

const vivinoSearchUrlTemplate = "https://www.vivino.com/search/wines?q=";

const timeoutMS = 20000;


function getAllWineRatingsFromShop(wineShop) {
   switch (wineShop) {
      case "majestic":
         getAllWineRatings(proxyUrl, vivinoSearchUrlTemplate, majesticWineUrlTemplates, resolveMajesticUrl, parseMajesticWines); break;
      case "laithwaites":
         getAllWineRatings(proxyUrl, vivinoSearchUrlTemplate, laithwaitesUrlTemplates, resolveLaithwaitesUrl, parseLaithwaitesWines); break;
      case "waitrose":
         getAllWineRatings(proxyUrl, vivinoSearchUrlTemplate, waitroseUrlTemplates, resolveWaitroseUrl, parseWaitroseWines); break;
      case "virgin":
         getAllWineRatings(proxyUrl, vivinoSearchUrlTemplate, virginWinesUrlTemplates, resolveVirginUrl, parseVirginWines); break;
      case "slurp":
         getAllWineRatings(proxyUrl, vivinoSearchUrlTemplate, slurpUrlTemplates, resolveSlurpUrl, parseSlurpWines, getSlurpLimit); break;
      case "honestgrapes":
         getAllWineRatings(proxyUrl, vivinoSearchUrlTemplate, honestGrapesUrlTemplates, resolveHonestGrapesUrl, parseHonestGrapesWines, getHonestGrapesLimit); break;
      case "bbr":
         getAllWineRatings(proxyUrl, vivinoSearchUrlTemplate, bbrUrlTemplates, resolveBbrUrl, parseBbr); break;
   }
}

function getAllWineRatings(proxyUrl, vivinoSearchUrlTemplate, wineUrlTemplates, resolveWineUrlFn, parseWinePageFn, parseWineLimitFn) {

   fetchAllWines(proxyUrl, wineUrlTemplates, resolveWineUrlFn, parseWinePageFn, parseWineLimitFn)                             // Get all wines
      .then(wineNamePromisesArray => Promise.all(wineNamePromisesArray))                  // Wait for all wine request promises to resolve
      .then(wineArray => fetchAllRatings(proxyUrl, vivinoSearchUrlTemplate, wineArray))   // Get ratings for all wines
      .then(wineRatingPromisesArray => Promise.all(wineRatingPromisesArray))              // Wait for all rating request promises to resolve
      .then(wineArray => outputSortedWines(wineArray));                                   // Sort and output rated wines
}

async function fetchAllWines(proxyUrl, wineUrlTemplates, resolveWineUrlFn, parseWinePageFn, parseWineLimitFn) {  
   var limit = Number.MAX_VALUE;
   if (parseWineLimitFn !== undefined) {
      limit = await parseWineLimitFn(proxyUrl, resolveWineUrlFn);
   }
   
   var winePromisesArray = [];
   for (var i = 0, l = wineUrlTemplates.length; i < l; i++) {
      let pageNum = 0;
      let winesOnPage = 0;

      // Iterate through all wine website pages
      do {
         const pageWinePromisesArray = await fetchWinePage(proxyUrl, resolveWineUrlFn(wineUrlTemplates[i], pageNum), parseWinePageFn);
         winePromisesArray = winePromisesArray.concat(pageWinePromisesArray);
         winesOnPage = pageWinePromisesArray.length;
         pageNum++;
         if (winePromisesArray.length >= limit) break;
      // } while (false);
      } while (winesOnPage > 0);
   }

   return winePromisesArray;
}

function resolveMajesticUrl(urlTemplate, pageNum) {
   return urlTemplate.replace("[PAGESIZE]", 50).replace("[PAGENO]", pageNum);
}

function resolveLaithwaitesUrl(urlTemplate, pageNum) {
   return urlTemplate.replace("[WINENO]", pageNum * 10).replace("[PAGENO]", pageNum + 1);
}

function resolveWaitroseUrl(urlTemplate, pageNum) {
   let pageSize = 24;
   return urlTemplate.replace("[PAGESIZE]", pageSize).replace("[BEGININDEX]", pageSize * pageNum);
}

function resolveVirginUrl(urlTemplate, pageNum) {
   return urlTemplate.replace("[PAGENO]", pageNum + 1);
}

function resolveSlurpUrl(urlTemplate, pageNum) {
   return urlTemplate.replace("[PAGENO]", pageNum + 1);
}

function resolveHonestGrapesUrl(urlTemplate, pageNum) {
   return urlTemplate.replace("[PAGENO]", pageNum + 1);
}

function resolveBbrUrl(urlTemplate, pageNum) {
   let pageSize = 30;
   return urlTemplate.replace("[PAGENO]", pageNum).replace("[PAGESIZE]", pageSize);
}


function fetchWinePage(proxyUrl, wineUrl, parseWinePageFn) {
   let url = proxyUrl + wineUrl;
   // console.log(url);
   const pageObject = fetch(url)
      .then(response => response.text())
      .then(responseText => parseWinePageFn(responseText));

   return pageObject;
}

async function parseMajesticWines(html) {
   var wineNameAndPriceArray = [];

   // Initialize the DOM parser
   const parser = new DOMParser();

   // Parse the text
   const document = parser.parseFromString(html, "text/html");

   const productDetailsElements = document.getElementsByClassName('product-details');
   // Find and iterate through all the wines listed on the page
   for (var i = 0, l = productDetailsElements.length; i < l; i++) {
      const productHeaderElements = productDetailsElements[i].getElementsByClassName('product-details__header')[0];
      const wineNameElement = productHeaderElements.getElementsByClassName('space-b--none')[0];
      const wineName = wineNameElement.outerText;

      const productPriceElements = productDetailsElements[i].getElementsByClassName('product-action__price-text')[0];
      const winePriceStr = productPriceElements.outerText.trim();
      const winePriceFloat = parseFloat(winePriceStr.replace(/[^0-9.]/gi, ''));

      output("progress", wineName + " (£" + winePriceFloat + ")");

      wineNameAndPriceArray.push([wineName, winePriceFloat]);
   }

   return wineNameAndPriceArray;
}

async function parseLaithwaitesWines(html) {
   var wineNameAndPriceArray = [];

   // Initialize the DOM parser
   const parser = new DOMParser();

   // Parse the text
   const document = parser.parseFromString(html, "text/html");

   var productWrapperElements = document.getElementsByClassName('product-wrapper');
   // Find and iterate through all the wines listed on the page
   for (var i = 0, l = productWrapperElements.length; i < l; i++) {
      var productWrapperElement = productWrapperElements[i];
      var printItemElement = productWrapperElement.getElementsByClassName('print-item');
      const wineElement = printItemElement[0].getElementsByTagName('h3')[0];
      const wineName = wineElement.outerText;

      const winePriceFloat = getLowestPrice(productWrapperElement);

      output("progress", wineName + " (£" + winePriceFloat + ")");

      wineNameAndPriceArray.push([wineName, winePriceFloat]);
   }

   function getLowestPrice(productWrapperElement) {
      var lowestPrice = Number.MAX_VALUE;
      var orderFormElements = productWrapperElement.getElementsByClassName("js-orderform");
      for (var i = 0, l1 = orderFormElements.length; i < l1; i++) {
         const orderFormElement = orderFormElements[i];
         const elements = orderFormElement.getElementsByTagName("*");

         var priceArray = [];
         for (var j = 0, l2 = elements.length; j < l2; j++) {
            const elementText = elements[j].outerText.trim();
            if (elementText.includes("Reservation Certificate") 
               || elementText.includes("In Bond") 
               || elementText.includes("Duty Paid")) continue;

            const prices = elementText.match(/[£]\d+.\d+/g);
            if (prices !== null) {
               priceArray.push(prices);
            }
         }

         priceArray = priceArray.flat();
         for (var j = 0, l2 = priceArray.length; j < l2; j++) {
            const price = parseFloat(priceArray[j].substr(1));
            if (price < lowestPrice) {
               lowestPrice = price;
            }
         }
      }

      return lowestPrice;
   }

   return wineNameAndPriceArray;
}

async function parseWaitroseWines(html) {
   var wineNameAndPriceArray = [];

   // Initialize the DOM parser
   const parser = new DOMParser();

   // Parse the text
   const document = parser.parseFromString(html, "text/html");
   
   const productCardElements = document.getElementsByClassName('productCard');
   
   // Find and iterate through all the wines listed on the page
   for (var i = 0, l = productCardElements.length; i < l; i++) {
      const wineNameElement = productCardElements[i].getElementsByClassName('productName')[0];
      const wineName = wineNameElement.outerText;

      const productPriceElements = productCardElements[i].getElementsByClassName('productCurrentPrice')[0];
      const winePriceStr = productPriceElements.outerText.trim();
      const winePriceFloat = parseFloat(winePriceStr.replace(/[^0-9.]/gi, ''));

      output("progress", wineName + " (£" + winePriceFloat + ")");

      wineNameAndPriceArray.push([wineName, winePriceFloat]);
   }

   return wineNameAndPriceArray;
}

async function parseVirginWines(html) {
   var wineNameAndPriceArray = [];

   // Initialize the DOM parser
   const parser = new DOMParser();

   // Parse the text
   const document = parser.parseFromString(html, "text/html");
   
   const productDetailsElements = document.getElementsByClassName('product-bottle col-12 col-md-6 col-xl-4 px-xl-1 mb-4');
   
   // Find and iterate through all the wines listed on the page
   for (var i = 0, l = productDetailsElements.length; i < l; i++) {
      const wineNameElement = productDetailsElements[i].getElementsByClassName('row product-name')[0];
      const wineName = wineNameElement.outerText.trim().split(" - ")[0];

      const productPriceElements = productDetailsElements[i].getElementsByClassName('d-block price text-right')[0];
      const winePriceStr = productPriceElements.outerText.trim();
      const winePriceFloat = parseFloat(winePriceStr.replace(/[^0-9.]/gi, ''));

      output("progress", wineName + " (£" + winePriceFloat + ")");

      wineNameAndPriceArray.push([wineName, winePriceFloat]);
   }

   return wineNameAndPriceArray;
}

async function parseSlurpWines(html) {
   var wineNameAndPriceArray = [];

   // Initialize the DOM parser
   const parser = new DOMParser();

   // Parse the text
   const document = parser.parseFromString(html, "text/html");
   
   const productDetailsElements = document.getElementsByClassName('product details product-item-details');
   
   // Find and iterate through all the wines listed on the page
   for (var i = 0, l = productDetailsElements.length; i < l; i++) {
      const wineNameElement = productDetailsElements[i].getElementsByClassName('product name product-item-name')[0];
      const wineName = wineNameElement.outerText.trim().split(" - ")[0];

      const productPriceElements = productDetailsElements[i].getElementsByClassName('price-container price-final_price tax weee')[0];
      const winePriceStr = productPriceElements.outerText.trim();
      const winePriceFloat = parseFloat(winePriceStr.replace(/[^0-9.]/gi, ''));

      output("progress", wineName + " (£" + winePriceFloat + ")");

      wineNameAndPriceArray.push([wineName, winePriceFloat]);
   }

   return wineNameAndPriceArray;
}

async function parseHonestGrapesWines(html) {
   var wineNameAndPriceArray = [];

   // Initialize the DOM parser
   const parser = new DOMParser();

   // Parse the text
   const document = parser.parseFromString(html, "text/html");
   
   const productDetailsElements = document.getElementsByClassName('product details product-item-details');
   
   // Find and iterate through all the wines listed on the page
   for (var i = 0, l = productDetailsElements.length; i < l; i++) {
      const wineNameElement = productDetailsElements[i].getElementsByClassName('product name product-item-name')[0];
      const wineName = wineNameElement.outerText.trim();

      const productPriceElements = productDetailsElements[i].getElementsByClassName('price')[0];
      const winePriceStr = productPriceElements.outerText.trim();
      const winePriceFloat = parseFloat(winePriceStr.replace(/[^0-9.]/gi, ''));

      output("progress", wineName + " (£" + winePriceFloat + ")");

      wineNameAndPriceArray.push([wineName, winePriceFloat]);
   }

   return wineNameAndPriceArray;
}

async function parseBbr(html) {
   var wineNameAndPriceArray = [];

   // Initialize the DOM parser
   const parser = new DOMParser();

   // Parse the text
   const document = parser.parseFromString(html, "text/html");
   
   const productDetailsElements = document.getElementsByClassName('productCardContent');
   
   // Find and iterate through all the wines listed on the page
   for (var i = 0, l = productDetailsElements.length; i < l; i++) {
      const wineNameElement = productDetailsElements[i].getElementsByClassName('productListTitle')[0];
      const wineName = wineNameElement.outerText.trim();

      const productPriceElements = productDetailsElements[i].getElementsByClassName('productPrice')[0];
      const winePriceStr = productPriceElements.outerText.trim();
      
      var winePriceFloat = 0.0;
      const prices = winePriceStr.match(/[£]\d+.\d+/g);
      if (prices !== null) {
         winePriceFloat = parseFloat(prices[0].substr(1));
      }

      output("progress", wineName + " (£" + winePriceFloat + ")");

      wineNameAndPriceArray.push([wineName, winePriceFloat]);
   }

   return wineNameAndPriceArray;
}

async function getSlurpLimit(proxyUrl, resolveWineUrlFn) {
   return await fetchWinePage(proxyUrl, resolveWineUrlFn(0), parseSlurpAndHonestGrapesLimit);
}

async function getHonestGrapesLimit(proxyUrl, resolveWineUrlFn) {
   return await fetchWinePage(proxyUrl, resolveWineUrlFn(0), parseSlurpAndHonestGrapesLimit);
}

async function parseSlurpAndHonestGrapesLimit(html) {
    // Initialize the DOM parser
   const parser = new DOMParser();

   // Parse the text
   const document = parser.parseFromString(html, "text/html");
   
   const amountElements = document.getElementsByClassName('toolbar-amount');
   const tokens = amountElements[0].outerText.trim().split(" ");
   return parseInt(tokens[tokens.length - 1]);
}





async function fetchAllRatings(proxyUrl, vivinoSearchUrlTemplate, wineNameAndPriceArray) {
   var wineArray = [];

   // Throttle requests to Vivino
   let waitFetch = (wineNameAndPrice) => new Promise(resolve => 
      {
         setTimeout(_ => 
            {
               let wineRating = fetchVivinoRating(proxyUrl, vivinoSearchUrlTemplate, wineNameAndPrice);
               resolve(wineRating);
            },
            Math.floor(Math.random() * timeoutMS)
         );
      }
   )

   for (const wineNameAndPrice of wineNameAndPriceArray) {
      wineArray.push(await waitFetch(wineNameAndPrice));
   }

   return wineArray;
}

function fetchVivinoRating(proxyUrl, vivinoSearchUrlTemplate, wineNameAndPrice) {
   var url = proxyUrl + vivinoSearchUrlTemplate + encodeURIComponent(wineNameAndPrice[0]);

   const ratingArray = fetch(url)
      .then(response => response.text())
      .then(responseText => parseVivinoRating(responseText))
      .then(ratingAndReviewCount => [wineNameAndPrice, ratingAndReviewCount, ratingAndReviewCount[0] / wineNameAndPrice[1]]);

   return ratingArray;
}

// Parse the rating from the page returned by Vivino
async function parseVivinoRating(html) {
  // Initialize the DOM parser
  const parser = new DOMParser();

  // Parse the text
  const document = parser.parseFromString(html, "text/html");

  const averageContainersElements = document.getElementsByClassName('average__container');
  for (var i = 0, l = averageContainersElements.length; i < l; i++) {
    // Find average rating
    const ratingElements = averageContainersElements[i].getElementsByClassName('text-inline-block light average__number');

    // Find number of reviews
    const reviewCountElements = averageContainersElements[i].getElementsByClassName('text-inline-block average__stars');

    if (ratingElements.length > 0 && reviewCountElements.length > 0) {
      const ratingStr = ratingElements[0].innerHTML.trim();
      const rating = parseFloat(ratingStr);
      if (isNaN(rating)) continue;

      const reviewCountStr = reviewCountElements[0].getElementsByClassName('text-micro')[0].innerHTML.trim(); 
      if (reviewCountStr.includes('ratings')) {
        const reviewCount = parseInt(reviewCountStr.slice(0, reviewCountStr.indexOf(' ')));
        if (isNaN(reviewCount)) continue;
         return [rating, reviewCount];
      }
    }  
  }

  return [0.0, 0];
}

async function outputSortedWines(wineArray) {
   output('result-sorted-by-value', wineArray.length + " wines, sorted by value (highest score for the money)");
   for (const wine of wineArray.sort((a,b) => b[2] - a[2])) {
      output('result-sorted-by-value',wine[0][0] + " | £" + wine[0][1] + " | " + wine[1][0] + " | " + wine[1][1]  + " | " + wine[2]);
   }
   
   output('result-sorted-by-rating', wineArray.length + " wines, sorted by rating");
   for (const wine of wineArray.sort(
      function(a,b) {
         const compareRating = b[1][0] - a[1][0];
         if (compareRating == 0.0) {
            return b[1][1] - a[1][1];
         }
         return compareRating;
         })) {
      output('result-sorted-by-rating',wine[0][0] + " | £" + wine[0][1] + " | " + wine[1][0] + " | " + wine[1][1]);
   }
}

function output(element, msg) {
   var e = document.getElementById(element);
   e.innerHTML += msg + '<br>';
}
