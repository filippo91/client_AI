'use strict';

/* https://github.com/angular/protractor/blob/master/docs/toc.md */

describe('my app', function() {


  it('should automatically redirect to /speedGraph when location hash/fragment is empty', function() {
    browser.get('index.html');
    expect(browser.getLocationAbsUrl()).toMatch("/speedGraph");
  });


  describe('speedGraph', function() {

    beforeEach(function() {
      browser.get('index.html#!/speedGraph');
    });


    it('should render speedGraph when user navigates to /speedGraph', function() {
      expect(element.all(by.css('[ng-view] p')).first().getText()).
        toMatch(/partial for view 1/);
    });

  });


  describe('speedTable', function() {

    beforeEach(function() {
      browser.get('index.html#!/speedTable');
    });


    it('should render speedTable when user navigates to /speedTable', function() {
      expect(element.all(by.css('[ng-view] p')).first().getText()).
        toMatch(/partial for view 2/);
    });

  });
});
