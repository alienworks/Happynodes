import React from 'react';
import ReactDOM from 'react-dom';
import History from './History';
import renderer from 'react-test-renderer';

it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<History />, div);
    ReactDOM.unmountComponentAtNode(div);
});

var data ={"data":[{"date":"2018-06-14","totalonline":37,"total":45},{"date":"2018-06-15","totalonline":37,"total":45},{"date":"2018-06-16","totalonline":37,"total":45},{"date":"2018-06-17","totalonline":40,"total":45},{"date":"2018-06-18","totalonline":38,"total":44},{"date":"2018-06-19","totalonline":37,"total":45},{"date":"2018-06-20","totalonline":37,"total":45},{"date":"2018-06-21","totalonline":37,"total":45},{"date":"2018-06-22","totalonline":39,"total":45},{"date":"2018-06-23","totalonline":37,"total":43},{"date":"2018-06-24","totalonline":38,"total":45},{"date":"2018-06-25","totalonline":36,"total":45},{"date":"2018-06-26","totalonline":38,"total":45},{"date":"2018-06-27","totalonline":38,"total":45},{"date":"2018-06-28","totalonline":36,"total":43},{"date":"2018-06-29","totalonline":36,"total":45},{"date":"2018-06-30","totalonline":36,"total":45},{"date":"2018-07-01","totalonline":36,"total":45},{"date":"2018-07-02","totalonline":36,"total":45},{"date":"2018-07-03","totalonline":35,"total":39},{"date":"2018-07-04","totalonline":40,"total":45},{"date":"2018-07-05","totalonline":38,"total":43},{"date":"2018-07-06","totalonline":40,"total":45},{"date":"2018-07-07","totalonline":34,"total":39},{"date":"2018-07-08","totalonline":37,"total":45},{"date":"2018-07-09","totalonline":38,"total":45},{"date":"2018-07-10","totalonline":43,"total":50},{"date":"2018-07-11","totalonline":43,"total":50},{"date":"2018-07-12","totalonline":42,"total":50},{"date":"2018-07-13","totalonline":42,"total":50},{"date":"2018-07-14","totalonline":43,"total":50},{"date":"2018-07-15","totalonline":43,"total":50},{"date":"2018-07-16","totalonline":43,"total":50},{"date":"2018-07-17","totalonline":43,"total":50},{"date":"2018-07-18","totalonline":40,"total":50},{"date":"2018-07-19","totalonline":42,"total":50},{"date":"2018-07-20","totalonline":44,"total":50},{"date":"2018-07-21","totalonline":42,"total":50},{"date":"2018-07-22","totalonline":40,"total":50},{"date":"2018-07-23","totalonline":40,"total":50},{"date":"2018-07-24","totalonline":43,"total":50},{"date":"2018-07-25","totalonline":42,"total":50},{"date":"2018-07-26","totalonline":41,"total":50},{"date":"2018-07-27","totalonline":41,"total":50},{"date":"2018-07-28","totalonline":43,"total":50},{"date":"2018-07-29","totalonline":41,"total":50},{"date":"2018-07-30","totalonline":99,"total":118},{"date":"2018-07-31","totalonline":98,"total":128},{"date":"2018-08-01","totalonline":100,"total":130},{"date":"2018-08-02","totalonline":91,"total":127},{"date":"2018-08-03","totalonline":89,"total":123},{"date":"2018-08-04","totalonline":96,"total":132},{"date":"2018-08-05","totalonline":93,"total":134},{"date":"2018-08-06","totalonline":96,"total":134},{"date":"2018-08-07","totalonline":97,"total":136},{"date":"2018-08-08","totalonline":97,"total":137},{"date":"2018-08-09","totalonline":97,"total":139},{"date":"2018-08-10","totalonline":97,"total":139},{"date":"2018-08-11","totalonline":92,"total":138},{"date":"2018-08-12","totalonline":93,"total":140},{"date":"2018-08-13","totalonline":101,"total":149},{"date":"2018-08-14","totalonline":93,"total":150},{"date":"2018-08-15","totalonline":100,"total":159},{"date":"2018-08-16","totalonline":99,"total":159}]}
describe("test against valid snapshot", ()=> {
    it("redner as expected", ()=> {
        const tree = renderer.create(<History historytest={{fulfilled:true, value:data}} />).toJSON();
        expect(tree).toMatchSnapshot();

    });
});
  