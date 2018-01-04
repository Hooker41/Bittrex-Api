
var intervalId;
var elapsedTime = 0;   //ms
var frequency = 1000; //ms
var timePeriod = 0;  //ms
var watchPrice = 0;
var currentBid = 0;
var currentAsk = 0;

var overpriced = false;
var isTracking = false;

var table = $('#myTable').DataTable({
    pageLength: 100,
    order: [[ 0, "desc" ]],
    bPaginate: false
  });

intervalId = setInterval(function(){
    $.post("/", { dataObj: {pair: 'BTC-LTC', tg_api:'orderbook'} }, function(res){
        
        table.clear().draw();

        var buyAry = res.result.buy;
        var sellAry = res.result.sell;
        
        var cnt = buyAry.length;
        
        for( var i = 0; i < 100; i++)
        {
            var buyOrderRate = buyAry[i].Rate;
            var sellOrderRate = sellAry[i].Rate;
            
            table.row.add( [
                buyOrderRate,
                sellOrderRate
              ] ).draw( false );
        }
    });

    $.post("/", { dataObj: {pair: 'BTC-LTC', tg_api:'ticker'} }, function(res){
        currentBid = res.result.Bid;
        currentAsk = res.result.Ask;
        $('h1#bidlabel').text('Bid: ' + currentBid );
        $('h1#asklabel').text('Ask: ' + currentAsk );
    });

    if(isTracking)
    {
        elapsedTime += frequency;
        if(elapsedTime > timePeriod)
        {   
            onTrackEnd();
        }
        else
        {
            if(currentBid >= watchPrice)
            {
                overpriced = true;
                $("#progressLabel").text("Bingo! Over priced");
            }
        }
    }

}, frequency);

function onTrackEnd()
{
    if(!overpriced)
        $("#progressLabel").text("Track Finished! Never over priced.");

    isTracking = false;
    $('#btn_start').text('Start Track');
    $('#btn_start').attr('aria-pressed', false);
}

function onTrackStart()
{
    $('#btn_start').text('Stop Track');
    $("#progressLabel").text("Watching...");

    timePeriod = $('#timeperiod').val() * 60000;
    watchPrice = $('#price').val();
    elapsedTime = 0;
    overpriced = false;
    isTracking = true;
}
function onTrackClick()
{
    var state = $('#btn_start').attr('aria-pressed');

    if(state == 'false')                                //Start Track
        onTrackStart();
    else                                                //End Track
        onTrackEnd();
}