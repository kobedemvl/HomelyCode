
document.addEventListener('DOMContentLoaded', () => {

    function gatherInputValues() {
        const houseDetails = {
            purchasePrice: parseFloat(document.getElementById('purchasePrice').value),
            sellingPrice: parseFloat(document.getElementById('sellingPrice').value)
        };

        const loanDetails = {
            buyerDownPayment: parseFloat(document.getElementById('buyerDownPayment').value),
            interestRate: parseFloat(document.getElementById('interestRate').value) / 100, // Convert to decimal
            loanDuration: parseFloat(document.getElementById('loanDuration').value),
            notaryCosts: parseFloat(document.getElementById('notaryCosts').value)
        };

        const homelyDetails = {
            homelyDownPayment: parseFloat(document.getElementById('homelyDownPayment').value),
            leverage: parseFloat(document.getElementById('leverage').value),
            buyoutDuration: parseFloat(document.getElementById('buyoutDuration').value)
        };

        // Aggregate all input data into a unified data structure
        const inputData = { ...houseDetails, ...loanDetails, ...homelyDetails };

        return inputData;
    }


    // Calculate monthly payments
    function calculateMonthlyPayments(inputValues) {
        const principal = inputValues.purchasePrice - inputValues.buyerDownPayment - inputValues.homelyDownPayment;
        const monthlyInterestRate = inputValues.interestRate / 12;
        const totalPayments = inputValues.loanDuration * 12;

        // Monthly payment calculation using the formula for an amortizing loan
        const monthlyPayment = (principal * monthlyInterestRate) / (1 - Math.pow(1 + monthlyInterestRate, -totalPayments));

        return monthlyPayment;
    }

    // Calculate total interest paid until buyout
    function calculateTotalInterest(inputValues) {
        //calculate total interest paid until buyout
        const monthlyPayment = calculateMonthlyPayments(inputValues);
        const totalPaymentsUntilBuyout = monthlyPayment * inputValues.buyoutDuration * 12;
        const totalInterestUntilBuyout = totalPaymentsUntilBuyout - (inputValues.purchasePrice - inputValues.buyerDownPayment - inputValues.homelyDownPayment) * (1 - Math.pow(1 + inputValues.interestRate / 12, -inputValues.buyoutDuration * 12));

        return totalInterestUntilBuyout;
    }

    function calculatePrincipalInterestMonthly(inputValues) {
        // returns the principal left for every month and the interest paid for every month,
        // assuming the interest rate is the same for every month
        // returns a complete array of the principal and interest for every month

        const monthlyPayment = calculateMonthlyPayments(inputValues);
        const monthlyInterestRate = inputValues.interestRate / 12;
        const totalPayments = inputValues.loanDuration * 12;
        const principal = inputValues.purchasePrice - inputValues.buyerDownPayment - inputValues.homelyDownPayment;
        const principalInterestMonthly = [{ principalLeft: principal, totalInterestPaid: 0 }];
        let principalLeft = principal;
        let interestPaid = 0;
        let totalInterestPaid = 0;
        let principalPaid = 0;

        for (let i = 0; i < totalPayments; i++) {
            interestPaid = principalLeft * monthlyInterestRate;
            principalPaid = monthlyPayment - interestPaid;
            totalInterestPaid += interestPaid;
            principalLeft -= principalPaid;
            principalInterestMonthly.push({ principalLeft, totalInterestPaid });
        }

        return principalInterestMonthly;
    }

    // Function to update the input field value and label when a slider is changed

    // Function to calculate and update output values
    function updateInformationOutput(inputValues) {
        // House appreciation calculations
        const totalAppreciation = inputValues.sellingPrice / inputValues.purchasePrice - 1;
        const yearlyAppreciationRate = (1 + totalAppreciation) ** (1 / inputValues.buyoutDuration) - 1;
        document.getElementById('houseAppreciation').textContent = (totalAppreciation * 100).toFixed(2) + '%';
        document.getElementById('houseAppreciationRate').textContent = (yearlyAppreciationRate * 100).toFixed(2) + '% per year';

        // Loan calculations
        const loanAmount = inputValues.purchasePrice - inputValues.buyerDownPayment - inputValues.homelyDownPayment;
        const monthlyPayment = calculateMonthlyPayments(inputValues);
        const totalInterest = monthlyPayment * inputValues.loanDuration * 12 - loanAmount;
        const totalInterestUntilBuyout = calculateTotalInterest(inputValues);

        document.getElementById('loanAmount').textContent = '€ ' + loanAmount.toFixed(0);
        document.getElementById('monthlyPayment').textContent = '€ ' + monthlyPayment.toFixed(1);
        document.getElementById('totalInterest').textContent = '€ ' + totalInterest.toFixed(0);
        document.getElementById('totalInterestUntilBuyout').textContent = '€ ' + totalInterestUntilBuyout.toFixed(0); // Assuming this is the same as totalInterest for now

        document.getElementById('purchasePriceValue').textContent = '€ ' + inputValues.purchasePrice
        document.getElementById('sellingPriceValue').textContent = '€ ' + inputValues.sellingPrice
        document.getElementById('buyoutDurationValue').textContent = inputValues.buyoutDuration + ' years'
        document.getElementById('buyerDownPaymentValue').textContent = '€ ' + inputValues.buyerDownPayment
        document.getElementById('interestRateValue').textContent = (inputValues.interestRate * 100).toFixed(2) + `%`
        document.getElementById('loanDurationValue').textContent = inputValues.loanDuration + ' years'
        document.getElementById('notaryCostsValue').textContent = '€ ' + inputValues.notaryCosts
        document.getElementById('homelyDownPaymentValue').textContent = '€ ' + inputValues.homelyDownPayment
        document.getElementById('leverageValue').textContent = inputValues.leverage
    }

    let chartPrincipalInterest;  // Declare a global variable to hold the chart instance

    function updateGraphPricipalInterest(inputValues) {
        const principalInterestMonthly = calculatePrincipalInterestMonthly(inputValues);
        const principalLeft = principalInterestMonthly
            .filter((_, index) => index % 4 === 0)
            .map(month => month.principalLeft);
        const interestPaid = principalInterestMonthly
            .filter((_, index) => index % 4 === 0)
            .map(month => month.totalInterestPaid);
    
        let options = {
            chart: {
                type: 'line',
                stacked: false,
                fill: {
                    opacity: 0.5
                },
                dataLabels: false,
                height: 300,
            },
            animations: {
                enabled: false
            },
            series: [{
                name: 'Principal Left',
                data: principalLeft
            }, {
                name: 'Interest Paid',
                data: interestPaid
            }],
            xaxis: {
                tickAmount: 10,
                categories: [...Array(principalLeft.length).keys()].map(month => {
                    const year = Math.floor(month * 4 / 12) + 1;
                    const monthName = new Date(2000, month * 4 % 12, 1).toLocaleString('default', { month: 'short' });
                    return `Y${year} ${monthName}`;
                })
            },
            yaxis: {
                labels: {
                    formatter: function (val) {
                        return val.toFixed(0);
                    }
                }
            },
        };
    
        let chartContainer = document.getElementById('chartContainerPrincipal');
    
        // Check if chart already exists
        if (chartPrincipalInterest) {
            // Update the existing chart's series
            chartPrincipalInterest.updateSeries([{
                name: 'Principal Left',
                data: principalLeft
            }, {
                name: 'Interest Paid',
                data: interestPaid
            }]);
        } else {
            // Initialize the chart for the first time
            chartPrincipalInterest = new ApexCharts(chartContainer, options);
            chartPrincipalInterest.render();
        }
    }
    
    let chartHouseValue;  // Declare a global variable to hold the chart instance
    function updateGraphsHouseValue(inputValues) {
        // updates the graph with house value
        const houseValue = []
        const yearlyAppreciationRate = (inputValues.sellingPrice / inputValues.purchasePrice) ** (1 / inputValues.buyoutDuration) - 1;
        for (let i = 0; i < inputValues.buyoutDuration; i++) {
            houseValue.push(inputValues.purchasePrice * (1 + yearlyAppreciationRate) ** i);
        }
        houseValue.push(inputValues.sellingPrice);
        const homelyStakeValue = houseValue.map(value => ((value / inputValues.purchasePrice - 1) * inputValues.leverage + 1) * inputValues.homelyDownPayment);
        const buyerStakeValue = houseValue.map(value => value - homelyStakeValue[houseValue.indexOf(value)]);


        // Apex Charts for house value and homely stake value
        let options = {
            chart: {
                type: 'line',
                stacked: false,
                fill: {
                    opacity: 0.5
                },
                dataLabels: false,
                height: 300,
            },
            animations: {
                enabled: false  // Disable animations
            },
            series: [{
                name: 'House Value',
                data: houseValue,
                dataLabels: {
                    enabled: false
                }
            },
            {
                name: 'Buyer Stake Value',
                data: buyerStakeValue,
                dataLabels: {
                    enabled: false
                }
            },
            {
                name: 'Homely Stake Value',
                data: homelyStakeValue,
                dataLabels: {
                    enabled: false
                }
            },
            ],

            xaxis: {
                tickAmount: 10, // Set the maximum number of ticks
                categories: [...Array(houseValue.length).keys()].map(year => {
                    return `Y${year}`;
                })
            },

            yaxis: {
                labels: {
                    formatter: function (val) {
                        return val.toFixed(0);
                    }
                }
            },
        }
        
        let chartContainer = document.getElementById('chartContainerHouseValue');

        // Check if chart already exists
        if (chartHouseValue) {
            // Update the existing chart's series
            chartHouseValue.updateSeries([{
                name: 'House Value',
                data: houseValue
            },
            {
                name: 'Buyer Stake Value',
                data: buyerStakeValue
            },
            {
                name: 'Homely Stake Value',
                data: homelyStakeValue
            },
            ]);
        } else {
            // Initialize the chart for the first time
            chartHouseValue = new ApexCharts(chartContainer, options);
            chartHouseValue.render();
        }
    }

    function updateAll() {
        // Gather input values
        const inputValues = gatherInputValues();

        updateInformationOutput(inputValues);
        updateGraphPricipalInterest(inputValues);
        updateGraphsHouseValue(inputValues);
    }

    // Add event listeners to input fields
    document.getElementById('purchasePrice').addEventListener('input', updateAll);
    document.getElementById('sellingPrice').addEventListener('input', updateAll);
    document.getElementById('buyoutDuration').addEventListener('input', updateAll);
    document.getElementById('buyerDownPayment').addEventListener('input', updateAll);
    document.getElementById('interestRate').addEventListener('input', updateAll);
    document.getElementById('loanDuration').addEventListener('input', updateAll);
    document.getElementById('notaryCosts').addEventListener('input', updateAll);
    document.getElementById('homelyDownPayment').addEventListener('input', updateAll);
    document.getElementById('leverage').addEventListener('input', updateAll);

    // Initial calculation
    updateAll();

});




