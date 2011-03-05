require('node.io').scrape(function() {
    var self = this;
    this.getHtml('http://www.reddit.com/', function(err, $) {
        if (err) {
            self.exit(err);
        } else {
            $('a.title').each(function(title) {  
                console.log(title.text);
            });
            self.skip();
        }
    });
});
